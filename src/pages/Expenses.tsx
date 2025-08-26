
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Eye, Tag, RefreshCw, Search, Info, CalendarDays, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/hooks/useTransactions";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useReceiptViewer } from "@/hooks/useReceiptViewer";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useFiscalYear } from "@/contexts/FiscalYearContext";
import { useTaxCalculator } from "@/hooks/useTaxCalculator";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { toast } from "@/components/ui/sonner";
import { useBusinessExpensesTotal } from "@/hooks/useBusinessExpensesTotal";
import { useExpenseFilterOptions } from "@/hooks/useExpenseFilterOptions";
import { useCategorization } from "@/hooks/useCategorization";
import { useRuleApplication } from "@/hooks/useRuleApplication";
import { ValidSubcategorySelector } from "@/components/ValidSubcategorySelector";
import { supabase } from "@/integrations/supabase/client";

// Helper function to highlight search matches in text
const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 text-yellow-800 px-1 rounded">
        {part}
      </span>
    ) : part
  );
};

// 3-level classification system
const expenseCategories = {
  business: [
    "CME",
    "Fees & Insurance", 
    "Office Expenses or Supplies",
    "Auto Expense",
    "Parking"
  ],
  personal: [
    "Shared Business",
    "Personal"
  ]
};

const subcategories = {
  // Business subcategories
  "CME": [
    "Books, Subscriptions, Journals",
    "Professional Development/CME",
    "Travel & Conference",
    "Meals & Entertainment"
  ],
  "Fees & Insurance": [
    "CMPA Insurance",
    "Insurance - Prof Overhead Expense",
    "Professional Association Fees",
    "Private Health Plan Premiums",
    "Accounting & Legal",
    "Bank Fees or Interest",
    "Insurance - Home Office"
  ],
  "Office Expenses or Supplies": [
    "Capital Assets (Computer, Desk etc)",
    "Office Supplies",
    "Salary to Secretary",
    "Shared Overhead",
    "Patient Medical/Drug Supplies",
    "Gifts for Staff/Colleagues",
    "Office - Telecom",
    "Office - Internet",
    "Meals & Entertainment",
    "Insurance - Office"
  ],
  "Auto Expense": [
    "Gas",
    "Repairs",
    "Insurance",
    "Licensing Fees",
    "Finance/Lease Payment"
  ],
  "Parking": [], // No subcategories for Parking
  // Personal subcategories
  "Shared Business": [
    "Rent/Mortgage",
    "Hydro",
    "Gas",
    "Hot Water Heater",
    "Property Tax",
    "Water",
    "Home Insurance",
    "Cleaning Service",
    "Other"
  ],
  "Personal": [] // No subcategories for Personal
};

const Expenses = () => {
  const { user } = useAuth();
  const { transactions, isLoading, updateTransaction } = useTransactions();
  const { uploadReceipt, uploading } = useFileUpload();
  const { viewReceipt, loading: viewingReceipt } = useReceiptViewer();
  const { toast: useToastNotification } = useToast();
  const queryClient = useQueryClient();
  const { selectedYear, startDate: fiscalStartDate, endDate: fiscalEndDate } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(false);
  const [filterExpenseType, setFilterExpenseType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('');
  const [startDate, setStartDate] = useState(fiscalStartDate);
  const [endDate, setEndDate] = useState(fiscalEndDate);
  const [existingRules, setExistingRules] = useState<Set<string>>(new Set());
  
  // Get business expenses total (unfiltered)
  const { data: businessExpensesData, isLoading: isLoadingBusinessTotal } = useBusinessExpensesTotal();
  
  // Get filter options
  const { categories, subcategoriesByCategory, isLoadingCategories } = useExpenseFilterOptions();
  
  // Get tax settings for calculating tax savings
  const { taxSettings } = useTaxSettings();

  // Clear all filters function
  const clearAllFilters = () => {
    setShowOnlyUncategorized(false);
    setFilterExpenseType('all');
    setFilterCategory('');
    setFilterSubcategory('');
    setSearchQuery('');
    setStartDate(fiscalStartDate);
    setEndDate(fiscalEndDate);
  };

  // Update date range when fiscal year changes
  useEffect(() => {
    setStartDate(fiscalStartDate);
    setEndDate(fiscalEndDate);
  }, [fiscalStartDate, fiscalEndDate]);
  
  // Check if using custom date range
  const isCustomRange = startDate !== fiscalStartDate || endDate !== fiscalEndDate;

  const handleResetToFiscalYear = () => {
    setStartDate(fiscalStartDate);
    setEndDate(fiscalEndDate);
  };
  
  // Calculate total income for tax rate estimation
  const totalIncome = useMemo(() => {
    return transactions?.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear &&
             t.direction === 'credit' &&
             t.amount > 0;
    }).reduce((sum, t) => sum + t.amount, 0) || 0;
  }, [transactions, selectedYear]);
  
  const totalBusinessExpensesForTax = useMemo(() => {
    return transactions?.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear &&
             t.direction === 'debit' &&
             t.expense_type === 'business';
    }).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  }, [transactions, selectedYear]);
  
  const netIncome = totalIncome - totalBusinessExpensesForTax;
  const personalAmount = taxSettings?.personal_tax_credit_amount || 15000;
  const { calculation, federalBrackets, ontarioBrackets } = useTaxCalculator(netIncome, personalAmount, 0);
  
  // Calculate projected annual income and marginal tax rate
  const getMarginalTaxRate = (projectedIncome: number) => {
    let marginalFederalRate = 0.15; // Default to lowest bracket
    let marginalOntarioRate = 0.0505; // Default to lowest bracket
    
    // Find federal marginal rate
    for (const bracket of federalBrackets) {
      if (projectedIncome > bracket.min) {
        marginalFederalRate = bracket.rate;
      }
    }
    
    // Find Ontario marginal rate  
    for (const bracket of ontarioBrackets) {
      if (projectedIncome > bracket.min) {
        marginalOntarioRate = bracket.rate;
      }
    }
    
    return marginalFederalRate + marginalOntarioRate;
  };
  
  // Calculate projected annual income based on YTD data
  const currentDate = new Date();
  const monthsElapsed = currentDate.getMonth() + 1; // January = 1, December = 12
  const projectedAnnualIncome = monthsElapsed > 0 ? (totalIncome / monthsElapsed) * 12 : totalIncome;

  
  // Filter for debit transactions from relevant account types with all filters applied
  const expenseTransactions = useMemo(() => {
    let baseTransactions = transactions?.filter(t => {
      const transactionDate = new Date(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return transactionDate >= start && 
             transactionDate <= end &&
             t.direction === 'debit' &&
             ['chequing', 'savings', 'credit_card'].includes(t.account_type);
    }) || [];

    console.log('🔍 FILTERED Transaction Query - Starting with base transactions:', {
      count: baseTransactions.length,
      year: selectedYear,
      baseFilters: 'direction=debit, account_type in [chequing,savings,credit_card], date range'
    });

    // Apply uncategorized filter first
    if (showOnlyUncategorized) {
      const beforeCount = baseTransactions.length;
      baseTransactions = baseTransactions.filter(t => 
        !t.expense_type || !t.expense_category || !t.expense_subcategory
      );
      console.log('✅ Applied "Show only uncategorized" filter:', {
        beforeCount,
        afterCount: baseTransactions.length,
        criteria: 'missing expense_type OR expense_category OR expense_subcategory'
      });
    }

    // Apply expense type filter
    if (filterExpenseType !== 'all') {
      const beforeCount = baseTransactions.length;
      if (filterExpenseType === 'uncategorized') {
        baseTransactions = baseTransactions.filter(t => !t.expense_type);
      } else {
        baseTransactions = baseTransactions.filter(t => t.expense_type === filterExpenseType);
      }
      console.log('✅ Applied expense type filter:', {
        filterValue: filterExpenseType,
        beforeCount,
        afterCount: baseTransactions.length
      });
    }

    // Apply category filter
    if (filterCategory !== '' && filterCategory !== 'all') {
      const beforeCount = baseTransactions.length;
      if (filterCategory === 'uncategorized') {
        baseTransactions = baseTransactions.filter(t => !t.expense_category);
      } else {
        baseTransactions = baseTransactions.filter(t => t.expense_category === filterCategory);
      }
      console.log('✅ Applied category filter:', {
        filterValue: filterCategory,
        beforeCount,
        afterCount: baseTransactions.length
      });
    }

    // Apply subcategory filter
    if (filterSubcategory !== '' && filterSubcategory !== 'all') {
      const beforeCount = baseTransactions.length;
      if (filterSubcategory === 'uncategorized') {
        baseTransactions = baseTransactions.filter(t => !t.expense_subcategory);
      } else {
        baseTransactions = baseTransactions.filter(t => t.expense_subcategory === filterSubcategory);
      }
      console.log('✅ Applied subcategory filter:', {
        filterValue: filterSubcategory,
        beforeCount,
        afterCount: baseTransactions.length
      });
    }

    // Apply search filter
    if (searchQuery !== '') {
      const beforeCount = baseTransactions.length;
      baseTransactions = baseTransactions.filter(transaction => 
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('✅ Applied search filter:', {
        searchQuery,
        beforeCount,
        afterCount: baseTransactions.length
      });
    }

    console.log('🎯 FINAL FILTERED RESULTS:', {
      totalTransactions: baseTransactions.length,
      appliedFilters: {
        showOnlyUncategorized,
        filterExpenseType,
        filterCategory,
        filterSubcategory,
        searchQuery: searchQuery || 'none'
      },
      sampleTransactions: baseTransactions.slice(0, 3).map(t => ({
        description: t.description,
        expense_type: t.expense_type,
        expense_category: t.expense_category,
        expense_subcategory: t.expense_subcategory
      }))
    });

    return baseTransactions;
  }, [transactions, startDate, endDate, searchQuery, showOnlyUncategorized, filterExpenseType, filterCategory, filterSubcategory]);

  const handleUpdateTransaction = async (id: string, updates: any, originalTransaction?: any) => {
    try {
      await updateTransaction.mutateAsync({ id, updates });
      
      // Show tax savings toast if this is a business expense categorization
      if (updates.expense_subcategory && originalTransaction?.expense_type === 'business') {
        const expenseAmount = Math.abs(originalTransaction.amount);
        const marginalTaxRate = getMarginalTaxRate(projectedAnnualIncome);
        const taxSavings = Math.round(expenseAmount * marginalTaxRate);
        
        if (taxSavings > 0) {
          toast(`$${taxSavings} in tax savings`, {
            position: "top-right",
            duration: 4000,
            className: "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 shadow-lg rounded-xl font-medium text-lg p-6 min-w-[300px]",
          });
        }
      }
      
      useToastNotification({
        title: "Transaction Updated",
        description: "Transaction has been updated successfully.",
      });
    } catch (error) {
      useToastNotification({
        title: "Error",
        description: "Failed to update transaction.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (transactionId: string, file: File) => {
    try {
      const uploadResult = await uploadReceipt(file, transactionId);
      await handleUpdateTransaction(transactionId, { 
        receipt_path: uploadResult.path 
      });
      useToastNotification({
        title: "Receipt Uploaded",
        description: "Receipt has been uploaded successfully.",
      });
    } catch (error) {
      useToastNotification({
        title: "Upload Failed",
        description: "Failed to upload receipt.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshData = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      useToastNotification({
        title: "Data Refreshed",
        description: "All data has been refreshed from the database",
      });
    } catch (error) {
      useToastNotification({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  const { deleteRule } = useCategorization();
  const { applyRules } = useRuleApplication();

  const handleAutoTagChange = async (transactionId: string, checked: boolean, transaction: any) => {
    if (checked) {
      // Handle checking - create rule and apply to historical transactions
      try {
        // Determine the rule type based on expense_type
        const ruleType = transaction.expense_type === 'business' ? 'business_expense' : 'personal_expense';
        
        // Create auto-categorization rule for this transaction
        const { data: newRule, error } = await supabase
          .from('transaction_categorization_rules')
          .insert({
            user_id: user?.id,
            match_type: 'equals',
            type: ruleType,
            match_text: transaction.description,
            category: transaction.expense_category,
            subcategory: transaction.expense_subcategory
          })
          .select()
          .single();

        if (error) throw error;

        // Add the new rule to our existing rules set
        setExistingRules(prev => new Set([...prev, transaction.description]));

        // Show initial success message
        toast("✅ Auto-tag rule created. Applying to historical transactions...", {
          position: "bottom-left",
          duration: 2000,
        });

        // Apply the new rule to historical transactions
        try {
          const result = await applyRules.mutateAsync({ 
            rules: [newRule], 
            lookbackDays: 365 
          });

          // Show final success message with counts
          toast(`Auto-tag rule created and applied to ${result.updatedCount} past transaction${result.updatedCount !== 1 ? 's' : ''}`, {
            position: "bottom-left",
            duration: 4000,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 shadow-lg rounded-xl font-medium",
          });
        } catch (applyError) {
          console.error('Error applying rule to historical transactions:', applyError);
          toast("Rule created but failed to apply to historical transactions", {
            position: "bottom-left",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error creating auto-categorization rule:', error);
        toast("Failed to create auto-categorization rule", {
          position: "bottom-left", 
          duration: 3000,
        });
      }
    } else {
      // Handle unchecking - delete rule  
      try {
        // Find the rule to delete based on match_text (description)
        const { data: existingRule, error: findError } = await supabase
          .from('transaction_categorization_rules')
          .select('id')
          .eq('user_id', user?.id)
          .eq('match_text', transaction.description)
          .eq('match_type', 'equals')
          .in('type', ['business_expense', 'personal_expense'])
          .maybeSingle();

        if (findError) throw findError;

        if (existingRule) {
          const shouldDelete = window.confirm(
            "This will remove the auto-tag rule. Other transactions with this description will no longer be automatically categorized. Continue?"
          );

          if (shouldDelete) {
            const { error: deleteError } = await supabase
              .from('transaction_categorization_rules')
              .delete()
              .eq('id', existingRule.id)
              .eq('user_id', user?.id);

            if (deleteError) throw deleteError;

            // Remove from our existing rules set
            setExistingRules(prev => {
              const newSet = new Set(prev);
              newSet.delete(transaction.description);
              return newSet;
            });

            toast("Auto-tag rule removed", {
              position: "bottom-left",
              duration: 3000,
            });
          } else {
            // If user cancels, restore the checkbox to checked state
            // Force re-check by manually updating the UI state
            checkExistingRules();
          }
        }
      } catch (error) {
        console.error('Error removing auto-categorization rule:', error);
        toast("Failed to remove auto-categorization rule", {
          position: "bottom-left",
          duration: 3000,
        });
      }
    }
  };

  // Check for existing auto-categorization rules
  const checkExistingRules = async () => {
    if (!user?.id || !expenseTransactions?.length) return;

    try {
      const descriptions = expenseTransactions.map(t => t.description).filter(Boolean);
      
      const { data: rules, error } = await supabase
        .from('transaction_categorization_rules')
        .select('match_text')
        .eq('user_id', user.id)
        .eq('match_type', 'equals')
        .in('type', ['business_expense', 'personal_expense'])
        .in('match_text', descriptions);

      if (error) throw error;

      const ruleDescriptions = new Set(rules?.map(rule => rule.match_text) || []);
      setExistingRules(ruleDescriptions);
    } catch (error) {
      console.error('Error checking existing rules:', error);
    }
  };

  useEffect(() => {
    checkExistingRules();
  }, [user?.id, expenseTransactions]);

  // Debug logging for business expenses summary
  useEffect(() => {
    if (businessExpensesData) {
      console.log('🎯 UNFILTERED Business Expenses Data used in JSX:', {
        totalAmount: businessExpensesData.total,
        categoryTotals: businessExpensesData.categoryTotals,
        transactionCount: businessExpensesData.transactionCount,
        verification: 'This data should NOT change when table filters are applied (search, uncategorized toggle, etc.)'
      });
    }
  }, [businessExpensesData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // OLD FILTERED CALCULATIONS REMOVED - Now using unfiltered useBusinessExpensesTotal hook

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Categorize expenses and upload receipts for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-4">
          {isCustomRange && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">Custom Range</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetToFiscalYear}
                className="text-xs"
              >
                Reset to {selectedYear}
              </Button>
            </div>
          )}
          <Button onClick={handleRefreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Expense Summary by Category */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-red-900">Expense Summary by Category</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This total includes all business expenses for the selected year, even if filters are applied below.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-600">
            Business expense breakdown for {selectedYear}
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingBusinessTotal ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : (() => {
            // Use unfiltered business expenses data
            const categoryTotals = businessExpensesData?.categoryTotals || {};
            const totalAmount = businessExpensesData?.total || 0;
            
            // Sort categories by amount (highest first)
            const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a);

            return (
              <div className="space-y-3">
                {sortedCategories.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No business expense transactions found for {selectedYear}.</p>
                ) : (
                  <>
                    {sortedCategories.map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-700">{category}:</span>
                        <span className="font-semibold text-red-600">${amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 border-red-200 mt-4">
                      <span className="font-bold text-lg text-gray-900">Total Business Expenses (Year-to-Date):</span>
                      <span className="font-bold text-xl text-red-700">${totalAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Date Range and Filters */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Transactions
            </div>
            {isCustomRange && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">Custom Range</Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetToFiscalYear}
                  className="text-xs"
                >
                  Reset to {selectedYear}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  console.log('📅 Start date changed to:', e.target.value);
                  setStartDate(e.target.value);
                }}
                className="border-blue-200 focus:border-blue-400 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {startDate}</p>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  console.log('📅 End date changed to:', e.target.value);
                  setEndDate(e.target.value);
                }}
                className="border-blue-200 focus:border-blue-400 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {endDate}</p>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-4">
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Expense Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expense Type</label>
                <Select
                  value={filterExpenseType}
                  onValueChange={(value) => {
                    setFilterExpenseType(value);
                    // Reset dependent filters when expense type changes
                    setFilterCategory('');
                    setFilterSubcategory('');
                  }}
                >
                   <SelectTrigger className="min-w-[260px] border-blue-200 focus:border-blue-400 justify-between text-ellipsis whitespace-nowrap overflow-hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                     <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Show only uncategorized checkbox */}
                <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <Checkbox
                    id="show-uncategorized"
                    checked={showOnlyUncategorized}
                    onCheckedChange={(checked) => setShowOnlyUncategorized(checked as boolean)}
                    className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <label 
                    htmlFor="show-uncategorized" 
                    className="text-sm font-semibold text-amber-800 cursor-pointer"
                  >
                    Show only uncategorized
                  </label>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select
                  value={filterCategory}
                  onValueChange={(value) => {
                    setFilterCategory(value);
                    // Reset subcategory when category changes
                    setFilterSubcategory('');
                  }}
                  disabled={isLoadingCategories}
                >
                   <SelectTrigger className="min-w-[260px] border-blue-200 focus:border-blue-400 justify-between text-ellipsis whitespace-nowrap overflow-hidden">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                     <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subcategory</label>
                <Select
                  value={filterSubcategory}
                  onValueChange={setFilterSubcategory}
                  disabled={filterCategory === '' || filterCategory === 'all' || filterCategory === 'uncategorized'}
                >
                  <SelectTrigger className="min-w-[260px] border-blue-200 focus:border-blue-400 justify-between text-ellipsis whitespace-nowrap overflow-hidden">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                    {filterCategory !== 'all' && filterCategory !== 'uncategorized' && 
                     subcategoriesByCategory[filterCategory]?.map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Clear All Filters Button */}
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">All Transactions ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar and Filters */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search transactions by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
          {expenseTransactions.length === 0 ? (
             <div className="text-center py-8">
               <p className="text-gray-500">No expense transactions found for {selectedYear}. Add some transactions to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expense Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-center">Auto Tag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{highlightText(transaction.description || '', searchQuery)}</TableCell>
                      <TableCell className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(transaction.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.expense_type || "uncategorized"}
                           onValueChange={(value) => {
                             const updates: any = { 
                               expense_type: value === "uncategorized" ? null : value,
                               expense_subcategory: null // Always reset subcategory when type changes
                             };
                             
                             // Handle category based on expense type
                             if (value === "personal") {
                               // For personal expenses, set category to uncategorized
                               updates.expense_category = null;
                             } else if (value === "uncategorized") {
                               // For uncategorized type, reset category too
                               updates.expense_category = null;
                             } else if (value === "internal_transfer") {
                               // For internal transfer, set both category and subcategory to null
                               updates.expense_category = null;
                               updates.expense_subcategory = null;
                             } else {
                               // For business expenses, always reset category when switching from personal
                               // This prevents validation errors when personal categories are invalid for business
                               updates.expense_category = null;
                             }
                             
                             handleUpdateTransaction(transaction.id, updates);
                           }}
                        >
                          <SelectTrigger className={`min-w-[260px] justify-between text-ellipsis whitespace-nowrap overflow-hidden ${!transaction.expense_type ? 'text-center' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                             <SelectItem value="business">Business</SelectItem>
                             <SelectItem value="personal">Personal</SelectItem>
                             <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
                           </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell>
                         {transaction.expense_type && (transaction.expense_type as any) !== 'internal_transfer' ? (
                             <Select
                               value={transaction.expense_category || "uncategorized"}
                               onValueChange={(value) => {
                                 // Special handling for categories that don't need subcategories
                                 const updates: any = { 
                                   expense_category: value === "uncategorized" ? null : value,
                                   expense_subcategory: null // Always reset subcategory when category changes
                                 };
                                 
                                 // For Parking category, ensure subcategory is explicitly null
                                 if (value === "Parking") {
                                   updates.expense_subcategory = null;
                                 }
                                 
                                 handleUpdateTransaction(transaction.id, updates);
                               }}
                             >
                                <SelectTrigger className={`min-w-[260px] justify-between text-ellipsis whitespace-nowrap overflow-hidden ${!transaction.expense_category ? 'text-center' : 'text-left pl-3'}`}>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white">
                                   <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                                  {(transaction.expense_type === 'business' || transaction.expense_type === 'personal') && 
                                   expenseCategories[transaction.expense_type]?.map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                             </Select>
                         ) : (
                           <span className="text-gray-400 pl-3">
                             {(transaction.expense_type as any) === 'internal_transfer' 
                               ? 'Not applicable for Internal Transfer'
                               : 'Select expense type first'
                             }
                           </span>
                         )}
                       </TableCell>
                         <TableCell>
                           {(transaction.expense_type as any) === 'internal_transfer' ? (
                             <span className="text-gray-400 pl-3">Not applicable for Internal Transfer</span>
                           ) : (
                             <ValidSubcategorySelector
                               expenseType={transaction.expense_type as any}
                               expenseCategory={transaction.expense_category as any}
                               value={transaction.expense_subcategory as any}
                               onValueChange={(value) => 
                                 handleUpdateTransaction(transaction.id, { expense_subcategory: value }, transaction)
                               }
                             />
                           )}
                         </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id={`receipt-${transaction.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(transaction.id, file);
                            }}
                          />
                          {transaction.receipt_path ? (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600" title="Receipt uploaded">✅</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-teal-300 text-teal-600 hover:bg-teal-50"
                                onClick={() => viewReceipt(transaction.id)}
                                disabled={viewingReceipt}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {viewingReceipt ? "Loading..." : "View"}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() => document.getElementById(`receipt-${transaction.id}`)?.click()}
                              disabled={uploading}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {uploading ? "Uploading..." : "Upload"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`inline-flex items-center space-x-2 transition-all duration-200 ${
                                  !transaction.expense_category || !transaction.expense_subcategory 
                                    ? 'opacity-40 cursor-not-allowed' 
                                    : 'opacity-100 cursor-pointer hover:bg-blue-50 rounded-md px-2 py-1'
                                }`}>
                                  <Checkbox 
                                    checked={existingRules.has(transaction.description || '')}
                                    disabled={!transaction.expense_category || !transaction.expense_subcategory}
                                    onCheckedChange={(checked) => handleAutoTagChange(transaction.id, checked as boolean, transaction)}
                                    className={`transition-all duration-200 ${
                                      !transaction.expense_category || !transaction.expense_subcategory
                                        ? 'border-gray-300 cursor-not-allowed'
                                        : 'border-blue-400 hover:border-blue-500 cursor-pointer'
                                    }`}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Automatically tag similar transactions — uncheck to remove rule</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
