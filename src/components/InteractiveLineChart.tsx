import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  direction: 'credit' | 'debit';
  category_override?: string;
  income_source?: string;
  expense_type?: string;
}

interface InteractiveLineChartProps {
  transactions: Transaction[];
}

export const InteractiveLineChart: React.FC<InteractiveLineChartProps> = ({ transactions }) => {
  const { selectedYear } = useFiscalYear();
  
  // State for which metrics are visible
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalIncome: true,
    lastYearIncome: true,
    businessExpenses: true,
    personalExpenses: false,
    netProfit: true,
  });

  // Chart configuration with consistent colors from design system
  const chartConfig = {
    totalIncome: {
      label: "Total Income",
      color: "hsl(145 60% 70%)", // Auto Expense green
    },
    lastYearIncome: {
      label: "Last Year Income",
      color: "hsl(200 60% 78%)", // CME blue
    },
    businessExpenses: {
      label: "Business Expenses", 
      color: "hsl(0 65% 75%)", // Fuel red
    },
    personalExpenses: {
      label: "Personal Expenses",
      color: "hsl(280 65% 75%)", // Other purple
    },
    netProfit: {
      label: "Net Profit",
      color: "hsl(220 65% 75%)", // CME blue variant
    },
  };

  // Prepare monthly data
  const monthlyData = useMemo(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Filter transactions by year
    const currentYearTx = transactions.filter(t => 
      new Date(t.date).getFullYear() === selectedYear
    );
    
    const lastYearTx = transactions.filter(t => 
      new Date(t.date).getFullYear() === selectedYear - 1
    );

    return monthNames.map((month, index) => {
      // Current year income (business income)
      const totalIncome = currentYearTx
        .filter(t => 
          t.direction === 'credit' &&
          (t.category_override === 'business_income' || 
           (t.category_override === null && t.income_source !== null)) &&
          new Date(t.date).getMonth() === index
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Last year income (same month)
      const lastYearIncome = lastYearTx
        .filter(t => 
          t.direction === 'credit' &&
          (t.category_override === 'business_income' || 
           (t.category_override === null && t.income_source !== null)) &&
          new Date(t.date).getMonth() === index
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Business expenses
      const businessExpenses = currentYearTx
        .filter(t => 
          t.expense_type === 'business' &&
          new Date(t.date).getMonth() === index
        )
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // Personal expenses
      const personalExpenses = currentYearTx
        .filter(t => 
          t.expense_type === 'personal' &&
          t.amount < 0 &&
          new Date(t.date).getMonth() === index
        )
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      // Net profit (income - business expenses)
      const netProfit = totalIncome - businessExpenses;

      return {
        month,
        totalIncome,
        lastYearIncome,
        businessExpenses,
        personalExpenses,
        netProfit,
      };
    });
  }, [transactions, selectedYear]);

  const handleMetricToggle = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const legendItems = [
    { key: 'totalIncome', label: 'Total Income' },
    { key: 'lastYearIncome', label: 'Last Year Income (same month)' },
    { key: 'businessExpenses', label: 'Business Expenses' },
    { key: 'personalExpenses', label: 'Personal Expenses' },
    { key: 'netProfit', label: 'Net Profit' },
  ] as const;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Financial Trends</CardTitle>
        <CardDescription>
          Monthly financial metrics for {selectedYear} with toggleable data series
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Chart Area */}
          <div className="flex-1">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
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
                    content={<ChartTooltipContent 
                      labelFormatter={(label) => `${label} ${selectedYear}`}
                      formatter={(value, name) => [
                        `$${Number(value).toLocaleString()}`,
                        chartConfig[name as keyof typeof chartConfig]?.label || name
                      ]}
                    />}
                  />
                  
                  {visibleMetrics.totalIncome && (
                    <Line
                      type="monotone"
                      dataKey="totalIncome"
                      stroke="var(--color-totalIncome)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={300}
                    />
                  )}
                  
                  {visibleMetrics.lastYearIncome && (
                    <Line
                      type="monotone"
                      dataKey="lastYearIncome"
                      stroke="var(--color-lastYearIncome)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={300}
                    />
                  )}
                  
                  {visibleMetrics.businessExpenses && (
                    <Line
                      type="monotone"
                      dataKey="businessExpenses"
                      stroke="var(--color-businessExpenses)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={300}
                    />
                  )}
                  
                  {visibleMetrics.personalExpenses && (
                    <Line
                      type="monotone"
                      dataKey="personalExpenses"
                      stroke="var(--color-personalExpenses)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={300}
                    />
                  )}
                  
                  {visibleMetrics.netProfit && (
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      stroke="var(--color-netProfit)"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                      animationDuration={300}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {/* Interactive Legend */}
          <div className="w-64 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Toggle Metrics</h4>
            <div className="space-y-3">
              {legendItems.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-3">
                  <Checkbox
                    id={key}
                    checked={visibleMetrics[key]}
                    onCheckedChange={() => handleMetricToggle(key)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ 
                        backgroundColor: chartConfig[key].color,
                        opacity: visibleMetrics[key] ? 1 : 0.3
                      }}
                    />
                    <Label 
                      htmlFor={key} 
                      className={`text-sm cursor-pointer transition-opacity ${
                        visibleMetrics[key] ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      {label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary Info */}
            <div className="pt-4 border-t space-y-2">
              <div className="text-xs text-muted-foreground">
                {Object.values(visibleMetrics).filter(Boolean).length} of {legendItems.length} metrics visible
              </div>
              <div className="text-xs text-muted-foreground">
                Viewing: {selectedYear}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};