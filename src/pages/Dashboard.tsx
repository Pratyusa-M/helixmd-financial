import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions, getTransactionType } from "@/hooks/useTransactions";
import { useTaxSettings, getTaxRateByProvince } from "@/hooks/useTaxSettings";
import { useInstalments } from "@/hooks/useInstalments";
import { useCategorizedDeductions } from "@/hooks/useCategorizedDeductions";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, Calculator, TrendingUp, TrendingDown, Banknote, Plus, RefreshCw, Calendar, Info, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { InsightCard } from "@/components/InsightCard";
import { ProjectedInsightCard } from "@/components/ProjectedInsightCard";
import { TaxInstalmentsCard } from "@/components/TaxInstalmentsCard";
import { CompactTaxInstalmentCard } from "@/components/CompactTaxInstalmentCard";
import AverageMonthlyMetricsCard from "@/components/AverageMonthlyMetricsCard";
import { FiscalYearSelector } from "@/components/FiscalYearSelector";

import { useMNPExport } from "@/hooks/useMNPExport";
import { useExcelExport } from "@/hooks/useExcelExport";
import { useFiscalYear } from "@/contexts/FiscalYearContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportModeSelector } from "@/components/ExportModeSelector";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import FinancialTrendsChart from "@/components/FinancialTrendsChart";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { transactions, addMockIncomeData } = useTransactions();
  const { taxSettings } = useTaxSettings();
  const { upcomingInstalments, isEligibleForInstalments, quarterlyAmount } = useInstalments();
  const { 
    generateMNPExport, 
    totalCount, 
    hasFlagged,
    categorizedCount,
    flaggedCount
  } = useMNPExport();
  const { 
    exportToExcel, 
    exportSimpleTransactions,
    totalCount: simpleExportCount, 
    hasUncategorized 
  } = useExcelExport();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedYear } = useFiscalYear();
  
  
  // Use 2025 as current year and dynamically adapt for future years
  const currentYear = new Date().getFullYear();
  
  // Use the new categorized deductions hook
  const categorizedDeductions = useCategorizedDeductions(transactions, selectedYear);

  // Calculate current year transactions for income calculation
  const currentYearTransactions = transactions?.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getFullYear() === selectedYear;
  }) || [];

  // 1. Total Income YTD - credit transactions matching business income criteria
  const totalIncomeYTD = currentYearTransactions
    .filter(t =>
      t.direction === 'credit' &&
      (t.category_override === 'business_income' ||
       (t.category_override === null && t.income_source !== null))
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Calculate projected 2025 income
  const calculateProjected2025Income = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based (0 = January, 6 = July)
    const currentYear = now.getFullYear();
    
    // Get the last 6 full months, excluding the current month
    const last6FullMonths = [];
    for (let i = 1; i <= 6; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      last6FullMonths.push({ monthIndex, year });
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    console.log('=== PROJECTED INCOME CALCULATION DEBUG ===');
    console.log('Current date:', now.toLocaleDateString());
    console.log('Current month (0-based):', currentMonth, `(${monthNames[currentMonth]})`);
    console.log('Last 6 full months used for calculation:');
    
    // Calculate income for each of the 6 months
    const monthlyIncomeData = last6FullMonths.map(({ monthIndex, year }) => {
      const monthIncome = currentYearTransactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return (
            t.direction === 'credit' &&
            (t.category_override === 'business_income' ||
             (t.category_override === null && t.income_source !== null)) &&
            transactionDate.getFullYear() === year &&
            transactionDate.getMonth() === monthIndex
          );
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      console.log(`  ${monthNames[monthIndex]} ${year}: $${monthIncome.toLocaleString()}`);
      
      return {
        month: monthNames[monthIndex],
        year,
        income: monthIncome
      };
    });
    
    // Calculate total income from the 6 months
    const total6MonthsIncome = monthlyIncomeData.reduce((sum, month) => sum + month.income, 0);
    
    // Calculate average monthly income
    const averageMonthlyIncome = total6MonthsIncome / 6;
    
    // Get actual YTD income (Jan through current month)
    const actualYTDIncome = totalIncomeYTD;
    
    // Calculate how many months remain in the year (including current month)
    const monthsRemaining = 12 - currentMonth;
    
    // Project future income = 6-month average × remaining months
    const projectedFutureIncome = averageMonthlyIncome * monthsRemaining;
    
    // Final projected income = actual YTD + projected future
    const projectedTotalIncome = actualYTDIncome + projectedFutureIncome;
    
    console.log('---');
    console.log('Total income from 6 months:', `$${total6MonthsIncome.toLocaleString()}`);
    console.log('Average monthly income from 6 months:', `$${averageMonthlyIncome.toLocaleString()}`);
    console.log('Actual YTD income (Jan–now):', `$${actualYTDIncome.toLocaleString()}`);
    console.log('Number of months remaining in year:', monthsRemaining);
    console.log('Projected future income (6-month avg × remaining months):', `$${projectedFutureIncome.toLocaleString()}`);
    console.log('Final projected income (YTD + projected future):', `$${Math.round(projectedTotalIncome).toLocaleString()}`);
    console.log('=== END PROJECTED INCOME DEBUG ===');
    
    return {
      projectedTotalIncome,
      averageMonthlyIncome,
      total6MonthsIncome,
      monthlyIncomeData,
      actualYTDIncome,
      monthsRemaining,
      projectedFutureIncome
    };
  };

  const { projectedTotalIncome, averageMonthlyIncome } = calculateProjected2025Income();

  // Business Income YTD - credit transactions with business income category
  const businessIncomeYTD = currentYearTransactions
    .filter(t => 
      t.direction === 'credit' && 
      (t.category_override === 'business_income' || 
       (t.category_override === null && t.income_source !== null))
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // 2. Use categorized deductions for business expenses
  const businessExpensesYTD = categorizedDeductions.totalDeductions;

  // 3. Tax calculations (consistent with Tax Estimator)
  const personalAmount = taxSettings?.personal_tax_credit_amount || 15705;
  const otherCredits = 0;
  const netIncome = totalIncomeYTD - businessExpensesYTD;
  const taxableIncome = Math.max(0, netIncome - personalAmount - otherCredits);
  
  // Ontario 2024 tax brackets (same as in tax estimator)
  const federalBrackets = [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Infinity, rate: 0.33 },
  ];
  
  const ontarioBrackets = [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ];
  
  const calculateTax = (income: number, brackets: any[]) => {
    let tax = 0;
    let remainingIncome = income;
    
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
    
    return tax;
  };

  const federalTax = calculateTax(taxableIncome, federalBrackets);
  const ontarioTax = calculateTax(taxableIncome, ontarioBrackets);
  const totalTax = federalTax + ontarioTax;
  
  // After Tax Income = Total Income - Business Expenses - Total Tax
  const afterTaxIncome = totalIncomeYTD - businessExpensesYTD - totalTax;
  
  // Calculate tax savings based on business income and expenses
  const calculateTaxSavingsRate = (businessIncome: number) => {
    if (businessIncome < 100000) {
      return 0.22; // Flat 22% rate
    }
    
    // Blended tax rate calculation for income >= $100,000
    const brackets = [
      { upTo: 53359, rate: 0.2005 },
      { upTo: 106717, rate: 0.2415 },
      { upTo: 165430, rate: 0.2965 },
      { upTo: 235675, rate: 0.3148 },
      { upTo: Infinity, rate: 0.3389 }
    ];
    
    let tax = 0;
    let lower = 0;
    
    for (const { upTo, rate } of brackets) {
      const taxable = Math.min(businessIncome - lower, upTo - lower);
      if (taxable <= 0) break;
      tax += taxable * rate;
      lower = upTo;
    }
    
    return tax / businessIncome;
  };
  
  const taxSavingsRate = calculateTaxSavingsRate(businessIncomeYTD);
  const taxSavings = businessExpensesYTD * taxSavingsRate;
  
  // Calculate projected tax savings
  const calculateProjectedTaxSavings = () => {
    const now = new Date();
    const monthsElapsed = now.getMonth() + 1; // Current month (1-12)
    
    // Get last 6 months of data for business income
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    // Filter business income transactions with detailed logging
    const businessIncomeTransactions = currentYearTransactions.filter(t => 
      t.direction === 'credit' && 
      (t.category_override === 'business_income' || 
       (t.category_override === null && t.income_source !== null))
    );
    
    const last6MonthsBusinessIncomeTransactions = businessIncomeTransactions.filter(t =>
      new Date(t.date) >= sixMonthsAgo
    );
    
    const last6MonthsBusinessIncome = last6MonthsBusinessIncomeTransactions
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Get last 6 months of business expenses
    const last6MonthsBusinessExpenses = currentYearTransactions
      .filter(t => 
        t.expense_type === 'business' &&
        new Date(t.date) >= sixMonthsAgo
      )
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate projected business income with fallback logic
    let projectedBusinessIncome;
    let calculationMethod;
    const hasAtLeast6MonthsData = monthsElapsed >= 6;
    
    if (hasAtLeast6MonthsData) {
      // Use last 6 months average: (Last 6 months of income / 6) × 12
      projectedBusinessIncome = (last6MonthsBusinessIncome / 6) * 12;
      calculationMethod = "6-month average";
    } else {
      // Fallback to YTD average: (YTD income / months elapsed) × 12
      projectedBusinessIncome = (businessIncomeYTD / monthsElapsed) * 12;
      calculationMethod = "YTD average fallback";
    }
    
    // Calculate projected total income for tax bracket determination
    const projectedTotalIncome = (totalIncomeYTD / monthsElapsed) * 12;
    
    // Projected Business Expenses = if July or later, double YTD, otherwise max of projections
    const ytdProjection = (businessExpensesYTD / monthsElapsed) * 12;
    const sixMonthProjection = (last6MonthsBusinessExpenses / 6) * 12;
    const projectedExpenses = monthsElapsed >= 6
      ? businessExpensesYTD * 2
      : Math.max(ytdProjection, sixMonthProjection);
    
    // Use projected total income to determine tax rate
    const projectedTaxRate = calculateTaxSavingsRate(projectedTotalIncome);
    const projectedTaxSavings = projectedExpenses * projectedTaxRate;
    
    // COMPREHENSIVE DEBUG LOGGING
    console.log('=== PROJECTED TAX SAVINGS COMPREHENSIVE DEBUG ===');
    console.log('Current date:', now.toLocaleDateString());
    console.log('Months elapsed:', monthsElapsed);
    console.log('Six months ago cutoff:', sixMonthsAgo.toLocaleDateString());
    console.log('Has at least 6 months data:', hasAtLeast6MonthsData);
    console.log('---');
    
    console.log('=== BUSINESS INCOME TRANSACTIONS (ALL YTD) ===');
    businessIncomeTransactions.forEach((t, i) => {
      console.log(`${i + 1}. ${t.date} - ${t.description} - $${t.amount?.toLocaleString()} - Source: ${t.income_source || 'category_override: ' + t.category_override}`);
    });
    console.log('Total YTD Business Income:', businessIncomeYTD.toLocaleString());
    
    console.log('=== BUSINESS INCOME TRANSACTIONS (LAST 6 MONTHS) ===');
    last6MonthsBusinessIncomeTransactions.forEach((t, i) => {
      console.log(`${i + 1}. ${t.date} - ${t.description} - $${t.amount?.toLocaleString()} - Source: ${t.income_source || 'category_override: ' + t.category_override}`);
    });
    console.log('Total Last 6 Months Business Income:', last6MonthsBusinessIncome.toLocaleString());
    
    console.log('=== PROJECTED INCOME CALCULATION ===');
    console.log('Calculation method:', calculationMethod);
    if (hasAtLeast6MonthsData) {
      console.log(`Formula: (${last6MonthsBusinessIncome.toLocaleString()} / 6) × 12`);
      console.log(`= ${(last6MonthsBusinessIncome / 6).toLocaleString()} × 12`);
      console.log(`= ${projectedBusinessIncome.toLocaleString()}`);
    } else {
      console.log(`Formula: (${businessIncomeYTD.toLocaleString()} / ${monthsElapsed}) × 12`);
      console.log(`= ${(businessIncomeYTD / monthsElapsed).toLocaleString()} × 12`);
      console.log(`= ${projectedBusinessIncome.toLocaleString()}`);
    }
    console.log('FINAL PROJECTED BUSINESS INCOME:', Math.round(projectedBusinessIncome).toLocaleString());
    
    console.log('=== TAX RATE CALCULATION ===');
    console.log('Projected income for tax calculation:', Math.round(projectedBusinessIncome).toLocaleString());
    console.log('Is projected income under $100k?', projectedBusinessIncome < 100000);
    
    // Let's also debug the tax rate calculation step by step
    if (projectedBusinessIncome < 100000) {
      console.log('Using flat 22% tax rate');
    } else {
      console.log('Using blended tax rate calculation...');
      const brackets = [
        { upTo: 53359, rate: 0.2005 },
        { upTo: 106717, rate: 0.2415 },
        { upTo: 165430, rate: 0.2965 },
        { upTo: 235675, rate: 0.3148 },
        { upTo: Infinity, rate: 0.3389 }
      ];
      
      let tax = 0;
      let lower = 0;
      
      console.log('Bracket calculations:');
      for (const { upTo, rate } of brackets) {
        const taxable = Math.min(projectedBusinessIncome - lower, upTo - lower);
        if (taxable <= 0) break;
        tax += taxable * rate;
        console.log(`  Income ${lower.toLocaleString()} to ${upTo.toLocaleString()}: $${taxable.toLocaleString()} × ${(rate * 100).toFixed(2)}% = $${(taxable * rate).toLocaleString()}`);
        lower = upTo;
      }
      console.log(`Total tax: $${tax.toLocaleString()}`);
      console.log(`Blended rate: ${tax.toLocaleString()} / ${projectedBusinessIncome.toLocaleString()} = ${((tax / projectedBusinessIncome) * 100).toFixed(2)}%`);
    }
    
    console.log('FINAL TAX RATE:', (projectedTaxRate * 100).toFixed(2) + '%');
    
    console.log('=== EXPENSE PROJECTIONS ===');
    console.log('YTD Business Expenses:', businessExpensesYTD.toLocaleString());
    console.log('Last 6 months Business Expenses:', last6MonthsBusinessExpenses.toLocaleString());
    console.log(`YTD projection: (${businessExpensesYTD.toLocaleString()} / ${monthsElapsed}) × 12 = ${Math.round(ytdProjection).toLocaleString()}`);
    console.log(`6-month projection: (${last6MonthsBusinessExpenses.toLocaleString()} / 6) × 12 = ${Math.round(sixMonthProjection).toLocaleString()}`);
    console.log('PROJECTED EXPENSES (max of above):', Math.round(projectedExpenses).toLocaleString());
    
    console.log('=== FINAL CALCULATION ===');
    console.log('projectedBusinessIncome:', Math.round(projectedBusinessIncome).toLocaleString());
    console.log('projectedExpenses:', Math.round(projectedExpenses).toLocaleString());
    console.log('projectedTaxRate:', (projectedTaxRate * 100).toFixed(2) + '%');
    console.log(`Projected Tax Savings = ${Math.round(projectedExpenses).toLocaleString()} × ${(projectedTaxRate * 100).toFixed(2)}%`);
    console.log('final projectedTaxSavings:', Math.round(projectedTaxSavings).toLocaleString());
    console.log('=== END COMPREHENSIVE DEBUG ===');
    
    return projectedTaxSavings;
  };
  
  const projectedTaxSavings = calculateProjectedTaxSavings();
  
  console.log('Dashboard calculations:', {
    totalIncomeYTD,
    businessIncomeYTD,
    businessExpensesYTD,
    taxSavingsRate,
    taxSavings,
    projectedTaxSavings,
    totalTax,
    afterTaxIncome,
    roundedAfterTaxIncome: Math.round(Math.max(0, afterTaxIncome))
  });

  const displayName = profile?.name ? `Dr ${profile.name.split(' ').pop()}` : 'Dr User';

  const handleAddMockData = async () => {
    try {
      await addMockIncomeData.mutateAsync();
      toast({
        title: "Mock Data Added",
        description: "Added $20,000 monthly income for Jan-June 2025",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add mock data",
        variant: "destructive",
      });
    }
  };

  const handleRefreshData = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['taxSettings', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Data Refreshed",
        description: "All data has been refreshed from the database",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  const handleSimpleExport = async () => {
    try {
      const userName = user?.email?.split('@')[0] || user?.email || 'Unknown User';
      const result = exportSimpleTransactions(selectedYear, userName);
      const message = result.uncategorizedCount > 0 
        ? `Downloaded ${result.filename} with ${result.totalCount} transactions (${result.uncategorizedCount} uncategorized)`
        : `Downloaded ${result.filename} with ${result.totalCount} transactions`;
      
      toast({
        title: "Export Successful",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleMNPExport = async () => {
    try {
      const result = await generateMNPExport(selectedYear);
      toast({
        title: "MNP Export Successful",
        description: `Downloaded ${result.filename} with ${result.totalCount} transactions`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleClearAuthSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Session Cleared",
      description: "Local and session storage cleared",
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your financial overview for {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <FiscalYearSelector />
          <ExportModeSelector
            onSimpleExport={handleSimpleExport}
            onMNPExport={handleMNPExport}
            disabled={!selectedYear || !transactions || transactions.length === 0}
            totalCount={simpleExportCount}
            hasFlagged={hasUncategorized}
          />
        </div>
      </div>

      {/* Keep the 5 summary cards as-is */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncomeYTD.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Income from {currentYear}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-sm font-medium mb-1">Projected 2025 Income</div>
              <div className="text-2xl font-bold text-green-600">
                ${Math.round(projectedTotalIncome).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">
                Based on last 6 months average
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${businessExpensesYTD.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Categorized business deductions
            </p>
            {categorizedDeductions.totalDeductions > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                {categorizedDeductions.breakdown.business.amount > 0 && (
                  <div className="flex justify-between">
                    <span>Business Expenses:</span>
                    <span>${categorizedDeductions.breakdown.business.amount.toLocaleString()}</span>
                  </div>
                )}
                {categorizedDeductions.breakdown.auto.amount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>{categorizedDeductions.breakdown.auto.description}:</span>
                    <span>${categorizedDeductions.breakdown.auto.amount.toFixed(0)}</span>
                  </div>
                )}
                {categorizedDeductions.breakdown.parking.amount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Parking Expenses:</span>
                    <span>${categorizedDeductions.breakdown.parking.amount.toFixed(0)}</span>
                  </div>
                )}
                {categorizedDeductions.breakdown.shared.amount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Home Office Expenses:</span>
                    <span>${categorizedDeductions.breakdown.shared.amount.toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${netIncome.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Income minus business expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
            <Calculator className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${Math.round(totalTax).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Federal + provincial tax owed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">After Tax Income</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${Math.round(Math.max(0, afterTaxIncome)).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Income - expenses - tax
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Layout: 50/50 split with improved spacing */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column - Average Monthly Metrics card */}
        <div className="flex">
          <AverageMonthlyMetricsCard transactions={transactions || []} />
        </div>
        
        {/* Right column - Stack tax savings cards and compact tax instalment card */}
        <div className="space-y-6">
          {businessExpensesYTD > 0 && (
            <>
              <InsightCard taxSavings={taxSavings} />
              <ProjectedInsightCard projectedTaxSavings={projectedTaxSavings} />
            </>
          )}
          <CompactTaxInstalmentCard />
        </div>
      </div>

      {/* Charts section remains the same */}
      <div className="grid gap-6 md:grid-cols-2">
        <FinancialTrendsChart transactions={transactions || []} />
        
        <ExpenseBreakdownChart 
          transactions={transactions || []} 
          selectedYear={selectedYear} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
