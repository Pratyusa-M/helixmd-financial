
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { extractTaxInstalmentsFromTransactions, extractCRAQuarterlyPayments } from '@/utils/taxInstalments';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  institution_name: string;
  account_name: string;
  description: string;
  amount: number;
  expense_type: 'business' | 'personal' | 'internal_transfer';
  expense_category: string | null;
  expense_subcategory: string | null;
  receipt_path: string | null;
  created_at: string;
  direction: 'credit' | 'debit';
  account_type: string;
  plaid_raw: any;
  category_override: 'business_income' | 'other_income' | null;
  income_source: 'OHIP' | 'Fee for Service/Locum' | 'Honoraria' | 'AFP Funding' | 'ER/On-Call Coverage' | 'Recruiting Bonus' | 'Stipend' | 'CMPA Reimbursements' | 'Other' | null;
}

// Helper function to determine transaction type
export const getTransactionType = (amount: number): 'income' | 'expense' => {
  return amount >= 0 ? 'income' : 'expense';
};

export const useTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to extract and create tax instalments from transactions
  const processTaxInstalments = async (transactionsData: any[]) => {
    if (!user || !transactionsData.length) return;

    try {
      // Extract general tax instalments (existing logic)
      const generalInstalments = extractTaxInstalmentsFromTransactions(transactionsData);
      
      // Extract CRA quarterly payments (new logic)
      const craQuarterlyPayments = extractCRAQuarterlyPayments(transactionsData);
      
      // Combine both sets of instalments, prioritizing CRA quarterly payments for duplicates
      const combinedInstalments = [...craQuarterlyPayments];
      
      // Add general instalments that don't conflict with CRA quarterly payments
      generalInstalments.forEach(generalInstalment => {
        const isDuplicate = craQuarterlyPayments.some(craPayment => 
          craPayment.user_id === generalInstalment.user_id &&
          craPayment.amount === generalInstalment.amount &&
          craPayment.date === generalInstalment.date
        );
        
        if (!isDuplicate) {
          combinedInstalments.push(generalInstalment);
        }
      });
      
      if (combinedInstalments.length === 0) return;

      // Check which ones don't already exist in the database
      const existingInstalments = await supabase
        .from('tax_instalments')
        .select('user_id, amount, date')
        .eq('user_id', user.id);

      if (existingInstalments.error) {
        console.error('Error fetching existing tax instalments:', existingInstalments.error);
        return;
      }

      const existingSet = new Set(
        existingInstalments.data.map(inst => 
          `${inst.user_id}-${inst.amount}-${inst.date}`
        )
      );

      const newInstalments = combinedInstalments.filter(inst => 
        !existingSet.has(`${inst.user_id}-${inst.amount}-${inst.date}`)
      );

      if (newInstalments.length === 0) return;

      // Insert new tax instalments
      const { error: insertError } = await supabase
        .from('tax_instalments')
        .insert(newInstalments);

      if (insertError) {
        console.error('Error inserting tax instalments:', insertError);
      } else {
        // Log successful auto-tagging for CRA payments
        const craAutoTagged = newInstalments.filter(inst => inst.method === 'auto');
        if (craAutoTagged.length > 0) {
          console.log(`Auto-tagged ${craAutoTagged.length} CRA quarterly payment(s):`, craAutoTagged);
        }
        
        // Invalidate tax instalments cache
        queryClient.invalidateQueries({ queryKey: ['tax-instalments', user.id] });
      }
    } catch (error) {
      console.error('Error processing tax instalments:', error);
    }
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // New hook to get income transactions using the view
  const { data: incomeTransactions = [], isLoading: isLoadingIncome } = useQuery({
    queryKey: ['income-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('view_income_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['transactions', user?.id] });
      await queryClient.cancelQueries({ queryKey: ['income-transactions', user?.id] });

      // Snapshot the previous values
      const previousTransactions = queryClient.getQueryData(['transactions', user?.id]);
      const previousIncomeTransactions = queryClient.getQueryData(['income-transactions', user?.id]);

      // Optimistically update the cache
      queryClient.setQueryData(['transactions', user?.id], (old: any) => {
        if (!old) return old;
        return old.map((transaction: any) => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        );
      });

      queryClient.setQueryData(['income-transactions', user?.id], (old: any) => {
        if (!old) return old;
        return old.map((transaction: any) => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        );
      });

      return { previousTransactions, previousIncomeTransactions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions', user?.id], context.previousTransactions);
      }
      if (context?.previousIncomeTransactions) {
        queryClient.setQueryData(['income-transactions', user?.id], context.previousIncomeTransactions);
      }
    },
    onSuccess: () => {
      // Just invalidate without forcing immediate refetch to let optimistic updates persist
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['income-transactions', user?.id], refetchType: 'none' });
      // CRITICAL: Force refetch of business expenses to update summary immediately
      queryClient.invalidateQueries({ queryKey: ['business-expenses-total', user?.id] });
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: any) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['income-transactions', user?.id] });
      
      // Process the new transaction for potential tax instalments
      if (data) {
        await processTaxInstalments([data]);
      }
    },
  });

  const addMockIncomeData = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user found');
      
      const mockTransactions = [];
      for (let month = 0; month < 6; month++) {
        const date = new Date(2025, month, 15); // 15th of each month
        mockTransactions.push({
          date: date.toISOString().split('T')[0],
          institution_name: 'Mock Bank',
          account_name: 'Checking Account',
          description: `Monthly Income - ${date.toLocaleString('default', { month: 'long' })} 2025`,
          amount: 20000,
          expense_type: 'personal' as const,
          expense_category: null,
          expense_subcategory: null,
          receipt_path: null,
          direction: 'credit' as const,
          account_type: 'chequing',
          plaid_raw: null,
          category_override: null,
          user_id: user.id
        });
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(mockTransactions)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['income-transactions', user?.id] });
      
      // Process the new transactions for potential tax instalments
      if (data && data.length > 0) {
        await processTaxInstalments(data);
      }
    },
  });

  const processExistingTransactions = useMutation({
    mutationFn: async () => {
      if (!user || !transactions.length) throw new Error('No transactions to process');
      await processTaxInstalments(transactions);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-instalments', user?.id] });
    },
  });

  return {
    transactions,
    incomeTransactions,
    isLoading,
    isLoadingIncome,
    updateTransaction,
    addTransaction,
    addMockIncomeData,
    processExistingTransactions,
  };
};
