import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface ExpenseBreakdownChartProps {
  transactions: Transaction[];
  selectedYear: number;
}

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ 
  transactions, 
  selectedYear 
}) => {
  const [viewMode, setViewMode] = useState<'category' | 'subcategory'>('category');

  // Category color mapping using pastel green, blue, and purple shades
  const categoryColors = {
    'Auto': 'hsl(145 60% 70%)',           // Soft mint green
    'Meals': 'hsl(210 65% 75%)',          // Light sky blue
    'Office': 'hsl(260 55% 75%)',         // Soft lavender
    'Travel': 'hsl(180 50% 70%)',         // Pale teal
    'Marketing': 'hsl(290 45% 78%)',      // Light orchid
    'Education': 'hsl(200 60% 78%)',      // Powder blue
    'Professional': 'hsl(160 55% 72%)',   // Seafoam green
    'Home Office': 'hsl(240 50% 80%)',    // Periwinkle
    'Equipment': 'hsl(170 45% 75%)',      // Aqua mint
    'Subscriptions': 'hsl(280 40% 82%)',  // Pale plum
    'Auto Expense': 'hsl(145 60% 70%)',   // Soft mint green (same as Auto)
    'Office Expenses or Supplies': 'hsl(260 55% 75%)', // Soft lavender (same as Office)
    'CME': 'hsl(200 60% 78%)',            // Powder blue (same as Education)
    'Fees & Insurance': 'hsl(320 50% 76%)', // Rose quartz
    'Shared Business': 'hsl(160 55% 72%)', // Seafoam green (same as Professional)
    'Parking': 'hsl(195 55% 80%)',        // Light cerulean
    'Other': 'hsl(220 30% 85%)',          // Very light blue-gray
  };

  // Generate subcategory colors (variations of main category colors)
  const getSubcategoryColor = (category: string, subcategory: string, index: number) => {
    const baseColors = [
      'hsl(145 60% 70%)', 'hsl(210 65% 75%)', 'hsl(260 55% 75%)', 'hsl(180 50% 70%)',
      'hsl(290 45% 78%)', 'hsl(200 60% 78%)', 'hsl(160 55% 72%)', 'hsl(240 50% 80%)',
      'hsl(170 45% 75%)', 'hsl(280 40% 82%)', 'hsl(195 55% 80%)', 'hsl(320 50% 76%)'
    ];
    
    // Find the category index, defaulting to 0 if not found
    const categoryIndex = Object.keys(categoryColors).indexOf(category);
    const baseIndex = categoryIndex >= 0 ? categoryIndex % baseColors.length : 0;
    const baseColor = baseColors[baseIndex] || baseColors[0]; // Fallback to first color
    
    // Create variations by adjusting lightness
    const variations = [
      baseColor,
      baseColor.replace(/(\d+)%\)$/, (match, lightness) => `${Math.max(20, parseInt(lightness) - 15)}%)`),
      baseColor.replace(/(\d+)%\)$/, (match, lightness) => `${Math.max(10, parseInt(lightness) - 30)}%)`),
      baseColor.replace(/(\d+)%\)$/, (match, lightness) => `${Math.min(90, parseInt(lightness) + 15)}%)`),
    ];
    
    return variations[index % variations.length] || baseColor; // Fallback to base color
  };

  const chartData = useMemo(() => {
    // Filter business expenses for selected year, excluding internal transfers
    const businessExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (
        t.expense_type === 'business' &&
        (t.expense_type as any) !== 'internal_transfer' && // Exclude internal transfers
        transactionDate.getFullYear() === selectedYear &&
        t.direction === 'debit' // Use direction instead of amount sign
      );
    });

    console.log('🔍 ExpenseBreakdownChart Debug:', {
      totalTransactions: transactions.length,
      selectedYear,
      businessExpenses: businessExpenses.length
    });

    if (viewMode === 'category') {
      // Group by main category
      const categoryTotals = businessExpenses.reduce((acc, transaction) => {
        const category = transaction.expense_category || 'Other';
        const amount = Math.abs(transaction.amount); // Convert negative amounts to positive for chart display
        
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += amount;
        
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          name: category,
          value: amount,
          fill: categoryColors[category as keyof typeof categoryColors] || categoryColors.Other
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Group by subcategory
      const subcategoryTotals = businessExpenses.reduce((acc, transaction) => {
        const category = transaction.expense_category || 'Other';
        const subcategory = transaction.expense_subcategory || 'General';
        const key = `${category} - ${subcategory}`;
        const amount = Math.abs(transaction.amount); // Convert negative amounts to positive for chart display
        
        if (!acc[key]) {
          acc[key] = {
            amount: 0,
            category,
            subcategory
          };
        }
        acc[key].amount += amount;
        
        return acc;
      }, {} as Record<string, { amount: number; category: string; subcategory: string }>);

      // Group subcategories by category for color assignment
      const categorizedSubcategories = Object.entries(subcategoryTotals).reduce((acc, [key, data]) => {
        if (!acc[data.category]) {
          acc[data.category] = [];
        }
        acc[data.category].push({ key, ...data });
        return acc;
      }, {} as Record<string, Array<{ key: string; amount: number; category: string; subcategory: string }>>);

      // Assign colors to subcategories
      const result: Array<{ name: string; value: number; fill: string }> = [];
      Object.entries(categorizedSubcategories).forEach(([category, subcategories]) => {
        subcategories.forEach((sub, index) => {
          result.push({
            name: sub.key,
            value: sub.amount,
            fill: getSubcategoryColor(category, sub.subcategory, index)
          });
        });
      });

      return result.sort((a, b) => b.value - a.value);
    }
  }, [transactions, selectedYear, viewMode]);

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString('en-CA', { 
              style: 'currency', 
              currency: 'CAD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
          <p className="text-sm text-muted-foreground">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="h-5 w-5" />
            Expense Breakdown
          </CardTitle>
          <CardDescription>
            Business expenses by {viewMode === 'category' ? 'category' : 'subcategory'} for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No business expenses found for {selectedYear}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>
              Business expenses by {viewMode === 'category' ? 'category' : 'subcategory'} for {selectedYear}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'category' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('category')}
              className="animate-scale-in"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Category
            </Button>
            <Button
              variant={viewMode === 'subcategory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('subcategory')}
              className="animate-scale-in"
            >
              <PieIcon className="h-4 w-4 mr-1" />
              Subcategory
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{}}
          className="h-[400px] w-full animate-scale-in"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Custom Legend - 3 items per row */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chartData.map((item, index) => {
              const displayName = viewMode === 'subcategory' ? item.name.split(' - ')[1] : item.name;
              
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-foreground font-medium truncate">
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseBreakdownChart;