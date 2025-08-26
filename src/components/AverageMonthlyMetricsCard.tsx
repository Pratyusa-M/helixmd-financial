import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useVehicleDeduction } from '@/hooks/useVehicleDeduction';
import { useProfile } from '@/hooks/useProfile';
import { useTaxCalculator } from '@/hooks/useTaxCalculator';
import { useTaxSettings } from '@/hooks/useTaxSettings';
import { TrendingUp } from 'lucide-react';

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

interface AverageMonthlyMetricsCardProps {
  transactions: Transaction[];
}

const AverageMonthlyMetricsCard: React.FC<AverageMonthlyMetricsCardProps> = ({ transactions }) => {
  const { selectedYear } = useFiscalYear();
  const vehicleDeduction = useVehicleDeduction(selectedYear);
  const { profile } = useProfile();
  const { taxSettings } = useTaxSettings();

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
  const otherCredits = 0;
  const { calculation } = useTaxCalculator(projectedAnnualIncome, personalAmount, otherCredits);
  const projectedTaxRate = projectedAnnualIncome > 0 ? calculation.totalTax / projectedAnnualIncome : 0;

  // Calculate average monthly metrics using the same logic as Financial Trends
  const averageMetrics = useMemo(() => {
    const currentYearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });

    // Find the latest month with actual transaction data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let lastMonthWithData = -1;
    if (selectedYear === currentYear) {
      lastMonthWithData = currentMonth;
    } else {
      lastMonthWithData = 11; // For other years, use all months
    }

    // Calculate totals across all months with data
    let totalGrossIncome = 0;
    let totalBusinessExpenses = 0;
    let totalPersonalExpenses = 0;
    let totalTaxes = 0;
    const monthsToAverage = lastMonthWithData + 1;

    for (let monthIndex = 0; monthIndex <= lastMonthWithData; monthIndex++) {
      const monthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === monthIndex;
      });

      // Calculate Gross Income (business income from Income tab where category_override = 'business_income')
      const grossIncome = monthTransactions
        .filter(t => 
          t.direction === 'credit' &&
          t.category_override === 'business_income'
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate Business Expenses (three sources)
      // 1. Direct business expenses (expense_type = 'business')
      const directBusinessExpenses = monthTransactions
        .filter(t => t.expense_type === 'business')
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // 2. Auto expenses based on vehicle deduction method
      let autoExpenses = 0;
      if (vehicleDeduction.deductionType === 'actual_expense') {
        autoExpenses = vehicleDeduction.deductionAmount / 12;
      } else if (vehicleDeduction.deductionType === 'per_km') {
        const monthlyBusinessKm = vehicleDeduction.totalBusinessKm / 12;
        const perKmRate = profile?.per_km_rate || 0.68;
        autoExpenses = monthlyBusinessKm * perKmRate;
      }

      // 3. Shared business expenses (expense_type = 'personal', category = 'Shared Business')
      const sharedBusinessExpenses = monthTransactions
        .filter(t => 
          t.expense_type === 'personal' && 
          t.expense_category === 'Shared Business'
        )
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      
      const homeOfficePercentage = (profile?.home_office_percentage || 0) / 100;
      const adjustedSharedExpenses = sharedBusinessExpenses * homeOfficePercentage;

      // Total business expenses = direct + auto + adjusted shared
      const businessExpenses = directBusinessExpenses + autoExpenses + adjustedSharedExpenses;

      // Calculate Personal Expenses
      const monthStart = new Date(selectedYear, monthIndex, 1);
      const monthEnd = new Date(selectedYear, monthIndex + 1, 0);
      
      const strictMonthTransactions = currentYearTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // 1. Direct personal expenses (direction = 'debit', expense_type = 'personal') excluding shared business
      const directPersonalExpenses = strictMonthTransactions
        .filter(t => 
          t.direction === 'debit' &&
          t.expense_type === 'personal' && 
          t.expense_category !== 'Shared Business'
        )
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // 2. Personal portion of shared business expenses
      const personalPortionOfShared = sharedBusinessExpenses * (1 - homeOfficePercentage);
      const personalExpenses = directPersonalExpenses + personalPortionOfShared;

      // Calculate monthly estimated tax using projected tax rate applied to monthly gross income
      const taxes = grossIncome * projectedTaxRate;

      // Add to totals
      totalGrossIncome += grossIncome;
      totalBusinessExpenses += businessExpenses;
      totalPersonalExpenses += personalExpenses;
      totalTaxes += taxes;
    }

    // Calculate averages
    const avgGrossIncome = totalGrossIncome / monthsToAverage;
    const avgBusinessExpenses = totalBusinessExpenses / monthsToAverage;
    const avgPersonalExpenses = totalPersonalExpenses / monthsToAverage;
    const avgTaxes = totalTaxes / monthsToAverage;
    const avgNetIncome = avgGrossIncome - avgBusinessExpenses - avgTaxes;
    const avgNetCashflow = avgNetIncome - avgPersonalExpenses;

    return {
      grossIncome: avgGrossIncome,
      businessExpenses: avgBusinessExpenses,
      personalExpenses: avgPersonalExpenses,
      taxes: avgTaxes,
      netIncome: avgNetIncome,
      netCashflow: avgNetCashflow
    };
  }, [transactions, selectedYear, vehicleDeduction, profile, projectedTaxRate]);

  const formatCurrency = (amount: number) => {
    return `$${Math.round(amount).toLocaleString()}`;
  };

  return (
    <Card className="flex-1 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Average Monthly Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center py-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Gross Income</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(averageMetrics.grossIncome)}
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Business Expenses</div>
            <div className="text-xl font-semibold text-red-600">
              {formatCurrency(averageMetrics.businessExpenses)}
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Personal Expenses</div>
            <div className="text-xl font-semibold text-orange-600">
              {formatCurrency(averageMetrics.personalExpenses)}
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Taxes</div>
            <div className="text-xl font-semibold text-purple-600">
              {formatCurrency(averageMetrics.taxes)}
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Net Income</div>
            <div className="text-xl font-semibold text-blue-600">
              {formatCurrency(averageMetrics.netIncome)}
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-sm text-muted-foreground mb-1">Net Cashflow</div>
            <div className="text-xl font-semibold text-cyan-600">
              {formatCurrency(averageMetrics.netCashflow)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AverageMonthlyMetricsCard;