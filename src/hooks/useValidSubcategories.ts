import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ExpenseType = Database['public']['Enums']['expense_type'];
type ExpenseCategory = Database['public']['Enums']['expense_category'];

export const useValidSubcategories = (expenseType?: ExpenseType, category?: ExpenseCategory) => {
  return useQuery({
    queryKey: ['valid-subcategories', expenseType, category],
    queryFn: async () => {
      if (!expenseType || !category) return [];
      
      const { data, error } = await supabase
        .from('category_subcategory_mapping')
        .select('expense_subcategory')
        .eq('expense_type', expenseType)
        .eq('expense_category', category)
        .order('expense_subcategory');
      
      if (error) throw error;
      
      return data.map(item => item.expense_subcategory);
    },
    enabled: !!expenseType && !!category,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};