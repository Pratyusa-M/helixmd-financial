import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { extractTaxInstalmentsFromTransactions, TaxInstalmentExtraction } from '@/utils/taxInstalments';
import { Tables } from '@/integrations/supabase/types';

type TaxInstalment = Tables<"tax_instalments">;

export const useTaxInstalments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: taxInstalments = [], isLoading } = useQuery({
    queryKey: ['tax-instalments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tax_instalments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as TaxInstalment[];
    },
    enabled: !!user,
  });

  const addTaxInstalment = useMutation({
    mutationFn: async (instalment: Omit<TaxInstalment, 'id' | 'created_at'>) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('tax_instalments')
        .insert({ ...instalment, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-instalments', user?.id] });
    },
  });

  const updateTaxInstalment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<TaxInstalment, 'id' | 'created_at' | 'user_id'>> }) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('tax_instalments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-instalments', user?.id] });
    },
  });

  const deleteTaxInstalment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user found');
      
      const { error } = await supabase
        .from('tax_instalments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-instalments', user?.id] });
    },
  });

  const extractAndCreateTaxInstalments = useMutation({
    mutationFn: async (transactions: Tables<"transactions">[]) => {
      if (!user) throw new Error('No user found');
      
      // Extract potential tax instalments from transactions
      const extractedInstalments = extractTaxInstalmentsFromTransactions(transactions);
      
      if (extractedInstalments.length === 0) {
        return [];
      }

      // Check which ones don't already exist
      const existingInstalments = await supabase
        .from('tax_instalments')
        .select('user_id, amount, date')
        .eq('user_id', user.id);

      if (existingInstalments.error) throw existingInstalments.error;

      const existingSet = new Set(
        existingInstalments.data.map(inst => 
          `${inst.user_id}-${inst.amount}-${inst.date}`
        )
      );

      const newInstalments = extractedInstalments.filter(inst => 
        !existingSet.has(`${inst.user_id}-${inst.amount}-${inst.date}`)
      );

      if (newInstalments.length === 0) {
        return [];
      }

      // Insert new tax instalments
      const { data, error } = await supabase
        .from('tax_instalments')
        .insert(newInstalments)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-instalments', user?.id] });
    },
  });

  return {
    taxInstalments,
    isLoading,
    addTaxInstalment,
    updateTaxInstalment,
    deleteTaxInstalment,
    extractAndCreateTaxInstalments,
  };
};