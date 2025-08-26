import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useVehicleDeduction } from '@/hooks/useVehicleDeduction';
import { useProfile } from '@/hooks/useProfile';
import { useTaxCalculator } from '@/hooks/useTaxCalculator';
import { useTaxSettings } from '@/hooks/useTaxSettings';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  direction: 'credit' | 'debit';
  expense_type?: 'business' | 'personal' | 'internal_transfer';
  expense_category?: string;
  expense_subcategory?: string;
  category_override?: string;
  income_source?: string;
  description?: string;
}

interface FinancialTrendsChartProps {
  transactions: Transaction[];
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
}

const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({ transactions }) => {
  const { selectedYear } = useFiscalYear();
  const vehicleDeduction = useVehicleDeduction(selectedYear);
  const { profile } = useProfile();
  const { taxSettings } = useTaxSettings();
  
  // Available metrics configuration
  const metricsConfig: MetricConfig[] = [
    { key: 'grossIncome', label: 'Gross Income', color: '#10b981' },
    { key: 'businessExpenses', label: 'Business Expenses', color: '#f59e0b' },
    { key: 'personalExpenses', label: 'Personal Expenses', color: '#ef4444' },
    { key: 'taxes', label: 'Taxes', color: '#8b5cf6' },
    { key: 'netIncome', label: 'Net Income', color: '#06b6d4' },
    { key: 'netCashflow', label: 'Net Cashflow', color: '#ec4899' }
  ];

  // State for visible metrics - default to showing only Gross Income
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(['grossIncome']);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    metricsConfig.forEach(metric => {
      config[metric.key] = {
        label: metric.label,
        color: metric.color
      };
    });
    return config;
  }, []);

  // Calculate YTD business income and projected annual income for tax calculations
  const ytdBusinessIncome = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });

    // Sum business income from January to current month
    let ytdIncome = 0;
    for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
      const monthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === monthIndex;
      });

      const monthlyBusinessIncome = monthTransactions
        .filter(t => 
          t.direction === 'credit' &&
          t.category_override === 'business_income'
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      ytdIncome += monthlyBusinessIncome;
    }

    return ytdIncome;
  }, [transactions, selectedYear]);

  // Calculate projected annual income and tax rate
  const projectedAnnualIncome = ytdBusinessIncome > 0 ? (ytdBusinessIncome / (new Date().getMonth() + 1)) * 12 : 0;
  
  // Use tax calculator to get projected tax rate
  const personalAmount = taxSettings?.personal_tax_credit_amount || 15000;
  const otherCredits = 0; // Will use other_credits from tax_settings table later
  const { calculation } = useTaxCalculator(projectedAnnualIncome, personalAmount, otherCredits);
  const projectedTaxRate = projectedAnnualIncome > 0 ? calculation.totalTax / projectedAnnualIncome : 0;

  // Process transaction data into monthly metrics
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });

    const rawData = months.map((month, index) => {
      const monthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === index;
      });

      // Calculate Gross Income (business income from Income tab where category_override = 'business_income')
      const grossIncome = monthTransactions
        .filter(t => 
          t.direction === 'credit' &&
          t.category_override === 'business_income'
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate Business Expenses (three sources)
      // 1. Direct business expenses (expense_type = 'business', excluding internal transfers)
      const directBusinessExpenses = monthTransactions
        .filter(t => t.expense_type === 'business' && (t.expense_type as any) !== 'internal_transfer')
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // 2. Auto expenses based on vehicle deduction method
      let autoExpenses = 0;
      if (vehicleDeduction.deductionType === 'actual_expense') {
        // Use actual auto expenses prorated by business use
        const monthlyAutoExpenses = monthTransactions
          .filter(t => 
            t.expense_type === 'business' && 
            (t.expense_type as any) !== 'internal_transfer' &&
            t.expense_category === 'Auto Expense'
          )
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        
        // This is already included in directBusinessExpenses above, so we need to get the 
        // vehicle deduction amount for this specific month
        const monthStart = new Date(selectedYear, index, 1);
        const monthEnd = new Date(selectedYear, index + 1, 0);
        
        // For now, we'll use a simple monthly average of the total vehicle deduction
        autoExpenses = vehicleDeduction.deductionAmount / 12;
      } else if (vehicleDeduction.deductionType === 'per_km') {
        // Use per km method: business_km × per_km_rate for this month
        const monthlyBusinessKm = vehicleDeduction.totalBusinessKm / 12; // Simple average
        const perKmRate = profile?.per_km_rate || 0.68;
        autoExpenses = monthlyBusinessKm * perKmRate;
      }

      // 3. Shared business expenses (expense_type = 'personal', category = 'Shared Business', excluding internal transfers)
      const sharedBusinessExpenses = monthTransactions
        .filter(t => 
          t.expense_type === 'personal' && 
          (t.expense_type as any) !== 'internal_transfer' &&
          t.expense_category === 'Shared Business'
        )
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      
      const homeOfficePercentage = (profile?.home_office_percentage || 0) / 100;
      const adjustedSharedExpenses = sharedBusinessExpenses * homeOfficePercentage;

      // Total business expenses = direct + auto + adjusted shared
      const businessExpenses = directBusinessExpenses + autoExpenses + adjustedSharedExpenses;

      // Calculate Personal Expenses with STRICT filtering and detailed logging
      
      // STRICT date filtering for this specific month
      const monthStart = new Date(selectedYear, index, 1);
      const monthEnd = new Date(selectedYear, index + 1, 0);
      
      const strictMonthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Debug logging for January specifically
      if (index === 0) { // January
        console.log('=== JANUARY PERSONAL EXPENSES DETAILED DEBUG ===');
        console.log('Date range:', {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        });
        console.log('Total transactions in January date range:', strictMonthTransactions.length);
        
        console.log('\n--- FILTERING LOGIC BEING APPLIED ---');
        console.log('Direct Personal Criteria:');
        console.log('- direction === "debit" (expenses only, not income)');
        console.log('- expense_type === "personal"');
        console.log('- expense_category !== "Shared Business"');
        console.log('- transaction date within month boundaries');
        
        console.log('\n--- ALL JANUARY TRANSACTIONS ---');
        strictMonthTransactions.forEach((t, idx) => {
          console.log(`Transaction ${idx + 1}:`, {
            id: t.id,
            date: t.date,
            description: t.description || 'No description',
            amount: t.amount,
            expense_type: t.expense_type,
            expense_category: t.expense_category,
            direction: t.direction,
            meetsPersonalCriteria: t.direction === 'debit' && t.expense_type === 'personal' && t.expense_category !== 'Shared Business'
          });
        });
      }

      // 1. ONLY personal expenses (direction = 'debit', expense_type = 'personal', excluding internal transfers) excluding shared business
      const directPersonalTransactions = strictMonthTransactions.filter(t => 
        t.direction === 'debit' &&
        t.expense_type === 'personal' && 
        (t.expense_type as any) !== 'internal_transfer' &&
        t.expense_category !== 'Shared Business'
      );
      
      const directPersonalExpenses = directPersonalTransactions
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // 2. ONLY shared business expenses (expense_type = 'personal' AND expense_category = 'Shared Business', excluding internal transfers)
      const sharedBusinessTransactions = strictMonthTransactions.filter(t => 
        t.expense_type === 'personal' && 
        (t.expense_type as any) !== 'internal_transfer' &&
        t.expense_category === 'Shared Business'
      );
      
      const sharedBusinessTotal = sharedBusinessTransactions
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      
      const personalPortionOfShared = sharedBusinessTotal * (1 - homeOfficePercentage);

      // Total personal expenses
      const personalExpenses = directPersonalExpenses + personalPortionOfShared;

      // Debug logging for January
      if (index === 0) { // January
        console.log('--- DIRECT PERSONAL EXPENSES ---');
        console.log('Direct personal transactions:', directPersonalTransactions.map(t => ({
          date: t.date,
          description: t.description || 'No description',
          amount: t.amount,
          expense_category: t.expense_category
        })));
        console.log('Direct personal expenses total:', directPersonalExpenses);
        
        console.log('--- SHARED BUSINESS EXPENSES ---');
        console.log('Shared business transactions:', sharedBusinessTransactions.map(t => ({
          date: t.date,
          description: t.description || 'No description',
          amount: t.amount,
          expense_category: t.expense_category
        })));
        console.log('Shared business total:', sharedBusinessTotal);
        console.log('Home office percentage:', (profile?.home_office_percentage || 0) + '%');
        console.log('Personal portion multiplier:', (1 - homeOfficePercentage));
        console.log('Personal portion of shared:', personalPortionOfShared);
        
        console.log('--- FINAL CALCULATION ---');
        console.log('Direct personal:', directPersonalExpenses);
        console.log('+ Personal portion of shared:', personalPortionOfShared);
        console.log('= TOTAL PERSONAL EXPENSES:', personalExpenses);
        console.log('Expected: $3,567.50');
        console.log('=== END JANUARY STRICT DEBUG ===');
      }

      // Calculate monthly estimated tax using projected tax rate applied to monthly gross income
      const taxes = grossIncome * projectedTaxRate;

      // Calculate derived metrics
      const netIncome = grossIncome - businessExpenses - taxes;
      const netCashflow = netIncome - personalExpenses;

      return {
        month,
        monthIndex: index,
        grossIncome,
        businessExpenses,
        personalExpenses,
        taxes,
        netIncome,
        netCashflow,
        // Only consider real data if there are actual transactions for this month
        hasRealData: monthTransactions.length > 0 && (grossIncome > 0 || directBusinessExpenses > 0 || directPersonalExpenses > 0)
      };
    });

    // Find the latest month with real data
    let lastMonthWithData = -1;
    for (let i = rawData.length - 1; i >= 0; i--) {
      if (rawData[i].hasRealData) {
        lastMonthWithData = i;
        break;
      }
    }

    // Debug logging
    console.log('=== FINANCIAL TRENDS DATA DEBUG ===');
    console.log('Raw data with hasRealData flags:', rawData.map(d => ({
      month: d.month,
      hasRealData: d.hasRealData,
      grossIncome: d.grossIncome,
      businessExpenses: d.businessExpenses,
      personalExpenses: d.personalExpenses
    })));
    console.log('Last month with data index:', lastMonthWithData);

    // If no data is found, default to current month
    if (lastMonthWithData === -1) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Only use current month if we're viewing the current year
      if (selectedYear === currentYear) {
        lastMonthWithData = currentMonth;
      } else {
        // For other years, include all months
        lastMonthWithData = 11;
      }
    }

    console.log('Final lastMonthWithData:', lastMonthWithData);
    console.log('Data will be sliced to:', lastMonthWithData + 1, 'months');

    // Return data only up to the last month with data, removing the helper properties
    const finalData = rawData.slice(0, lastMonthWithData + 1).map(({ hasRealData, monthIndex, ...data }) => data);
    console.log('Final data length:', finalData.length);
    console.log('Final data months:', finalData.map(d => d.month));
    console.log('=== END FINANCIAL TRENDS DEBUG ===');
    
    return finalData;
  }, [transactions, selectedYear, vehicleDeduction, profile, projectedTaxRate]);

  // Custom tooltip formatter that includes labels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="font-medium mb-2">{`Month: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const metricConfig = metricsConfig.find(m => m.key === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between gap-4 py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {metricConfig?.label || entry.dataKey}
                  </span>
                </div>
                <span className="font-mono font-medium text-sm">
                  ${Math.round(entry.value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Handle metric toggle
  const handleMetricToggle = (metricKey: string) => {
    setVisibleMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(key => key !== metricKey)
        : [...prev, metricKey]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Trends</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip 
                content={<CustomTooltip />}
              />
              
              {/* Render lines for visible metrics */}
              {visibleMetrics.map(metricKey => (
                <Line
                  key={metricKey}
                  type="monotone"
                  dataKey={metricKey}
                  stroke={chartConfig[metricKey]?.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom Legend - 3 items per row */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metricsConfig.map(metric => (
              <div key={metric.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={metric.key}
                  checked={visibleMetrics.includes(metric.key)}
                  onCheckedChange={() => handleMetricToggle(metric.key)}
                />
                <label
                  htmlFor={metric.key}
                  className="cursor-pointer flex items-center gap-2 font-medium text-foreground"
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: metric.color }}
                  />
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialTrendsChart;
