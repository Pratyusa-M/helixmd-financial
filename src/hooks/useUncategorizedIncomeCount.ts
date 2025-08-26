import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export const useUncategorizedIncomeCount = () => {
  const { user } = useAuth();
  const { startDate, endDate } = useFiscalYear();

  return useQuery({
    queryKey: ['uncategorized-income-count', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔍 Querying uncategorized income transactions:', {
        userId: user.id,
        startDate,
        endDate
      });

      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('direction', 'credit')
        .gte('date', startDate)
        .lte('date', endDate)
        .or('category_override.eq.uncategorized,income_source.eq.uncategorized');

      if (error) {
        console.error('❌ Error counting uncategorized income transactions:', error);
        throw error;
      }

      console.log('✅ Uncategorized income transactions count:', {
        count,
        sampleData: data?.slice(0, 3) // Log first 3 for debugging
      });

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};