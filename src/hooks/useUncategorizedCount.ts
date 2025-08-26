import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export const useUncategorizedCount = () => {
  const { user } = useAuth();
  const { startDate, endDate } = useFiscalYear();

  return useQuery({
    queryKey: ['uncategorized-count', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔍 Querying uncategorized transactions:', {
        userId: user.id,
        startDate,
        endDate
      });

      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .or('expense_type.is.null,expense_category.is.null,expense_subcategory.is.null');

      if (error) {
        console.error('❌ Error counting uncategorized transactions:', error);
        throw error;
      }

      console.log('✅ Uncategorized transactions count:', {
        count,
        sampleData: data?.slice(0, 3) // Log first 3 for debugging
      });

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};