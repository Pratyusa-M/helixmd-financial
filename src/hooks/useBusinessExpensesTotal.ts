import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export const useBusinessExpensesTotal = () => {
  const { user } = useAuth();
  const { selectedYear } = useFiscalYear();

  return useQuery({
    queryKey: ['business-expenses-total', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      console.log('🔍 UNFILTERED Query - Business expenses total:', {
        userId: user.id,
        year: selectedYear,
        startDate,
        endDate,
        filters: 'ONLY: direction=debit, expense_type=business, user_id, date range'
      });

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, expense_category')
        .eq('user_id', user.id)
        .eq('direction', 'debit')
        .eq('expense_type', 'business')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('❌ Error fetching business expenses total:', error);
        throw error;
      }

      console.log('✅ UNFILTERED Business expenses raw data:', {
        totalRowsReturned: data.length,
        confirmedFilters: {
          direction: 'debit',
          expense_type: 'business',
          dateRange: `${startDate} to ${endDate}`,
          userId: user.id
        },
        noFiltersApplied: 'search, uncategorized toggle, pagination, etc.',
        sampleTransactions: data.slice(0, 3).map(t => ({
          amount: t.amount,
          category: t.expense_category
        }))
      });

      // Calculate total and category breakdown
      const categoryTotals = data.reduce((acc, transaction) => {
        const category = transaction.expense_category || 'Uncategorized';
        const amount = Math.abs(transaction.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

      console.log('✅ UNFILTERED Calculated totals:', {
        totalAmount,
        categoryBreakdown: categoryTotals,
        numberOfCategories: Object.keys(categoryTotals).length,
        verification: 'This total should NOT change when table filters are applied'
      });

      return {
        total: totalAmount,
        categoryTotals,
        transactionCount: data.length
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};