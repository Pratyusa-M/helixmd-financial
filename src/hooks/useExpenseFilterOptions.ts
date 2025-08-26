import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export const useExpenseFilterOptions = () => {
  const { user } = useAuth();
  const { selectedYear } = useFiscalYear();

  // Fetch distinct expense categories
  const categoriesQuery = useQuery({
    queryKey: ['expense-categories', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('expense_category')
        .eq('user_id', user.id)
        .eq('direction', 'debit')
        .not('expense_category', 'is', null)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Get distinct categories
      const distinctCategories = [...new Set(data.map(t => t.expense_category))].filter(Boolean);
      return distinctCategories.sort();
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch distinct subcategories
  const subcategoriesQuery = useQuery({
    queryKey: ['expense-subcategories', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from('transactions')
        .select('expense_category, expense_subcategory')
        .eq('user_id', user.id)
        .eq('direction', 'debit')
        .not('expense_subcategory', 'is', null)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Group subcategories by category
      const subcategoriesByCategory = data.reduce((acc, t) => {
        if (t.expense_category && t.expense_subcategory) {
          if (!acc[t.expense_category]) {
            acc[t.expense_category] = new Set();
          }
          acc[t.expense_category].add(t.expense_subcategory);
        }
        return acc;
      }, {} as Record<string, Set<string>>);

      // Convert sets to sorted arrays
      const result = Object.keys(subcategoriesByCategory).reduce((acc, category) => {
        acc[category] = [...subcategoriesByCategory[category]].sort();
        return acc;
      }, {} as Record<string, string[]>);

      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    categories: categoriesQuery.data || [],
    subcategoriesByCategory: subcategoriesQuery.data || {},
    isLoadingCategories: categoriesQuery.isLoading,
    isLoadingSubcategories: subcategoriesQuery.isLoading,
  };
};