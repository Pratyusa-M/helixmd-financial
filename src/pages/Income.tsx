import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, Filter, RefreshCw, Search } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useFiscalYear } from "@/contexts/FiscalYearContext";
import { useCategorization } from "@/hooks/useCategorization";
import { useRuleApplication } from "@/hooks/useRuleApplication";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

const Income = () => {
  const { user } = useAuth();
  const { incomeTransactions, isLoadingIncome, updateTransaction } = useTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedYear, startDate: fiscalStartDate, endDate: fiscalEndDate } = useFiscalYear();
  
  const [startDate, setStartDate] = useState(fiscalStartDate);
  const [endDate, setEndDate] = useState(fiscalEndDate);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [existingRules, setExistingRules] = useState<Set<string>>(new Set());

  // Debug logging for fiscal year and transactions
  useEffect(() => {
    console.log('Fiscal Year Context:', { selectedYear, fiscalStartDate, fiscalEndDate });
    console.log('Raw incomeTransactions:', incomeTransactions);
  }, [selectedYear, fiscalStartDate, fiscalEndDate, incomeTransactions]);

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

  // Apply date, source, and search filtering based on user selection
  const filteredTransactions = useMemo(() => {
    const filtered = incomeTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const withinDateRange = transactionDate >= start && transactionDate <= end;
      
      const sourceMatch = selectedSource === 'all' || 
                         (selectedSource === 'uncategorized' && (!transaction.income_source || transaction.income_source === 'uncategorized' as any)) ||
                         transaction.income_source === selectedSource;
      
      const searchMatch = searchQuery === '' || 
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return withinDateRange && sourceMatch && searchMatch;
    });
    console.log('Filtered income transactions:', filtered);
    return filtered;
  }, [incomeTransactions, startDate, endDate, selectedSource, searchQuery]);

  // Calculate total business income and total income
  const totalBusinessIncome = filteredTransactions
    .filter(transaction => transaction.category_override === 'business_income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  
  const totalIncome = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const handleRefreshData = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['income-transactions', user?.id] });
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

  const handleCategoryChange = async (transactionId: string, newCategory: 'business_income' | 'other_income' | 'uncategorized' | 'Internal Transfer') => {
    try {
      const updates: any = { category_override: newCategory };
      
      if (newCategory === 'other_income' || newCategory === 'uncategorized' || newCategory === 'Internal Transfer') {
        updates.income_source = null;
      }
      
      const result = await updateTransaction.mutateAsync({
        id: transactionId,
        updates
      });
      
      toast({
        title: "Category Updated",
        description: newCategory === 'other_income' || newCategory === 'uncategorized' || newCategory === 'Internal Transfer'
          ? "Category updated and source cleared"
          : "Transaction category has been updated successfully",
      });
    } catch (error) {
      console.error('❌ Category update FAILED:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction category",
        variant: "destructive",
      });
    }
  };

  const handleSourceChange = async (transactionId: string, newSource: string | null) => {
    console.log('handleSourceChange:', { transactionId, newSource });
    try {
      const currentTransaction = filteredTransactions.find(t => t.id === transactionId);
      if (currentTransaction && (currentTransaction.category_override === null || currentTransaction.category_override === ('uncategorized' as any))) {
        toast({
          title: "Cannot Set Source",
          description: "Please select a category first before choosing a source",
          variant: "destructive",
        });
        return;
      }
      
      const updates: any = { income_source: newSource };
      if (currentTransaction && currentTransaction.category_override === null) {
        updates.category_override = 'business_income';
      }
      
      const result = await updateTransaction.mutateAsync({
        id: transactionId,
        updates
      });
      
      toast({
        title: "Source Updated",
        description: currentTransaction?.category_override === null 
          ? "Transaction source updated and category set to Business Income"
          : "Transaction source has been updated successfully",
      });
    } catch (error) {
      console.error('❌ Source update FAILED:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction source",
        variant: "destructive",
      });
    }
  };

  const { deleteRule } = useCategorization();
  const { applyRules } = useRuleApplication();

  const handleAutoTagChange = async (transactionId: string, checked: boolean, transaction: any) => {
    if (checked) {
      try {
        const { data: newRule, error } = await supabase
          .from('transaction_categorization_rules')
          .insert({
            user_id: user?.id,
            match_type: 'equals',
            type: 'business_income',
            match_text: transaction.description,
            category: transaction.income_source,
            subcategory: null
          })
          .select()
          .single();

        if (error) throw error;

        setExistingRules(prev => new Set([...prev, transaction.description]));

        sonnerToast("✅ Auto-tag rule created. Applying to historical transactions...", {
          position: "bottom-left",
          duration: 2000,
        });

        try {
          const result = await applyRules.mutateAsync({ 
            rules: [newRule], 
            lookbackDays: 365 
          });

          sonnerToast(`Auto-tag rule created and applied to ${result.updatedCount} past transaction${result.updatedCount !== 1 ? 's' : ''}`, {
            position: "bottom-left",
            duration: 4000,
            className: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 shadow-lg rounded-xl font-medium",
          });
        } catch (applyError) {
          console.error('Error applying rule to historical transactions:', applyError);
          sonnerToast("Rule created but failed to apply to historical transactions", {
            position: "bottom-left",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error creating auto-categorization rule:', error);
        sonnerToast("Failed to create auto-categorization rule", {
          position: "bottom-left",
          duration: 3000,
        });
      }
    } else {
      try {
        const { data: existingRule, error: findError } = await supabase
          .from('transaction_categorization_rules')
          .select('id')
          .eq('user_id', user?.id)
          .eq('match_text', transaction.description)
          .eq('match_type', 'equals')
          .eq('type', 'business_income')
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

            setExistingRules(prev => {
              const newSet = new Set(prev);
              newSet.delete(transaction.description);
              return newSet;
            });

            sonnerToast("Auto-tag rule removed", {
              position: "bottom-left",
              duration: 3000,
            });
          } else {
            checkExistingRules();
          }
        }
      } catch (error) {
        console.error('Error removing auto-categorization rule:', error);
        sonnerToast("Failed to remove auto-categorization rule", {
          position: "bottom-left",
          duration: 3000,
        });
      }
    }
  };

  const checkExistingRules = async () => {
    if (!user?.id || !incomeTransactions?.length) return;

    try {
      const descriptions = incomeTransactions.map(t => t.description).filter(Boolean);
      
      const { data: rules, error } = await supabase
        .from('transaction_categorization_rules')
        .select('match_text')
        .eq('user_id', user.id)
        .eq('match_type', 'equals')
        .eq('type', 'business_income')
        .in('match_text', descriptions);

      if (error) throw error;

      const ruleDescriptions = new Set(rules?.map(rule => rule.match_text) || []);
      setExistingRules(ruleDescriptions);
    } catch (error) {
      console.error('Error checking existing rules:', error);
    }
  };

  const syncDisplayedValuesWithDatabase = async () => {
    if (!incomeTransactions?.length || !user?.id) return;

    const transactionsToUpdate = incomeTransactions.filter(transaction => {
      const needsCategorySync = transaction.category_override === null;
      return needsCategorySync;
    });

    if (transactionsToUpdate.length === 0) return;

    console.log('🔄 [DB SYNC] Syncing UI defaults with database for', transactionsToUpdate.length, 'transactions');

    for (const transaction of transactionsToUpdate) {
      const updates: any = {};
      
      if (transaction.category_override === null) {
        updates.category_override = 'business_income';
      }
      
      if (Object.keys(updates).length > 0) {
        try {
          await updateTransaction.mutateAsync({
            id: transaction.id,
            updates
          });
        } catch (error) {
          console.error('❌ [DB SYNC] Failed to sync transaction:', transaction.id, error);
        }
      }
    }
  };

  useEffect(() => {
    checkExistingRules();
    syncDisplayedValuesWithDatabase();
  }, [user?.id, incomeTransactions]);

  const handleApplyFilter = () => {
    const sourceText = selectedSource === 'all' ? 'all sources' : selectedSource;
    toast({
      title: "Filter Applied",
      description: `Showing income from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} for ${sourceText}`,
    });
  };

  if (isLoadingIncome) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Tracking</h1>
          <p className="text-gray-600">Monitor your practice income</p>
        </div>
        <Button onClick={handleRefreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Income Summary by Source</CardTitle>
          <p className="text-sm text-gray-600">
            Income breakdown for the filtered period
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            const sourceGroups = filteredTransactions.reduce((acc, transaction) => {
              const source = (transaction.income_source as any) === 'uncategorized' || !transaction.income_source ? 'Uncategorized' : transaction.income_source;
              if (!acc[source]) {
                acc[source] = 0;
              }
              acc[source] += transaction.amount;
              return acc;
            }, {} as Record<string, number>);

            const sortedSources = Object.entries(sourceGroups).sort(([,a], [,b]) => b - a);

            return (
              <div className="space-y-3">
                {sortedSources.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No income transactions found for the selected period.</p>
                ) : (
                  <>
                    {sortedSources.map(([source, amount]) => (
                      <div key={source} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-700">{source}:</span>
                        <span className="font-semibold text-green-600">${amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 border-green-200 mt-4">
                      <span className="font-bold text-lg text-gray-900">Total Income:</span>
                      <span className="font-bold text-xl text-green-700">${totalIncome.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Source</label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="min-w-[260px] border-blue-200 focus:border-blue-400 justify-between text-ellipsis whitespace-nowrap overflow-hidden">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                  <SelectItem value="OHIP">OHIP</SelectItem>
                  <SelectItem value="Fee for Service/Locum">Fee for Service/Locum</SelectItem>
                  <SelectItem value="Honoraria">Honoraria</SelectItem>
                  <SelectItem value="AFP Funding">AFP Funding</SelectItem>
                  <SelectItem value="ER/On-Call Coverage">ER/On-Call Coverage</SelectItem>
                  <SelectItem value="Recruiting Bonus">Recruiting Bonus</SelectItem>
                  <SelectItem value="Stipend">Stipend</SelectItem>
                  <SelectItem value="CMPA Reimbursements">CMPA Reimbursements</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleApplyFilter} className="bg-blue-600 hover:bg-blue-700">
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Income Transactions</CardTitle>
          <p className="text-sm text-gray-600">
            Showing {filteredTransactions.length} transactions from checking and savings accounts
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
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
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No income transactions found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Auto Tag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const shouldBeEnabled = transaction.category_override === 'business_income' && 
                                          transaction.income_source && 
                                          (transaction.income_source as any) !== 'uncategorized';
                    return (
                      <TableRow key={transaction.id} className="hover:bg-blue-50">
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.institution_name}</TableCell>
                        <TableCell>{transaction.account_name}</TableCell>
                        <TableCell>{highlightText(transaction.description || '', searchQuery)}</TableCell>
                        <TableCell className="capitalize">{transaction.account_type}</TableCell>
                        <TableCell>
                          <Select
                            value={transaction.category_override === null ? 'uncategorized' : transaction.category_override}
                            onValueChange={(value: 'business_income' | 'other_income' | 'uncategorized' | 'Internal Transfer') => 
                              handleCategoryChange(transaction.id, value)
                            }
                          >
                            <SelectTrigger className={`min-w-[260px] justify-between text-ellipsis whitespace-nowrap overflow-hidden ${!transaction.category_override ? 'text-center' : 'text-left pl-3'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
                              <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                              <SelectItem value="business_income">Business Income</SelectItem>
                              <SelectItem value="other_income">Other</SelectItem>
                              <SelectItem value="Internal Transfer">Internal Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {transaction.category_override !== 'business_income' ? (
                            <span className="text-gray-400 pl-3">
                              {transaction.category_override === 'other_income' 
                                ? 'Not applicable for Other income'
                                : transaction.category_override === 'Internal Transfer'
                                ? 'Not applicable for Internal Transfer'
                                : 'Select category first'
                              }
                            </span>
                          ) : (
                            <Select
                              value={transaction.income_source === null ? "uncategorized" : transaction.income_source}
                              onValueChange={(value: string) => 
                                handleSourceChange(transaction.id, value === "uncategorized" ? null : value)
                              }
                            >
                              <SelectTrigger className={`min-w-[260px] justify-between text-ellipsis whitespace-nowrap overflow-hidden ${!transaction.income_source ? 'text-center' : 'text-left pl-3'}`}>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-white">
                                <SelectItem value="uncategorized" className="text-center">--</SelectItem>
                                <SelectItem value="OHIP">OHIP</SelectItem>
                                <SelectItem value="Fee for Service/Locum">Fee for Service/Locum</SelectItem>
                                <SelectItem value="Honoraria">Honoraria</SelectItem>
                                <SelectItem value="AFP Funding">AFP Funding</SelectItem>
                                <SelectItem value="ER/On-Call Coverage">ER/On-Call Coverage</SelectItem>
                                <SelectItem value="Recruiting Bonus">Recruiting Bonus</SelectItem>
                                <SelectItem value="Stipend">Stipend</SelectItem>
                                <SelectItem value="CMPA Reimbursements">CMPA Reimbursements</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {shouldBeEnabled && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <Checkbox
                                      checked={existingRules.has(transaction.description)}
                                      onCheckedChange={(checked) => handleAutoTagChange(transaction.id, !!checked, transaction)}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Automatically tag similar transactions — uncheck to remove rule</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Income;