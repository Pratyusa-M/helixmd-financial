
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TaxSettings {
  id: string;
  user_id: string;
  province: string;
  personal_tax_credit_amount: number;
  instalment_method: 'safe_harbour' | 'estimate' | 'not_required';
  safe_harbour_total_tax_last_year: number | null;
  created_at: string;
}

// Helper function to get tax rate based on province
export const getTaxRateByProvince = (province: string): number => {
  const taxRates: { [key: string]: number } = {
    'ON': 53.53, // Ontario combined federal + provincial
    'BC': 53.50, // British Columbia
    'AB': 47.74, // Alberta
    'SK': 47.50, // Saskatchewan
    'MB': 50.40, // Manitoba
    'QC': 53.31, // Quebec
    'NB': 53.30, // New Brunswick
    'NS': 54.00, // Nova Scotia
    'PE': 51.37, // Prince Edward Island
    'NL': 51.30, // Newfoundland and Labrador
    'YT': 48.00, // Yukon
    'NT': 47.05, // Northwest Territories
    'NU': 44.50, // Nunavut
  };
  
  return taxRates[province] || 50.00; // Default to 50% if province not found
};

export const useTaxSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: taxSettings, isLoading } = useQuery({
    queryKey: ['taxSettings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TaxSettings | null;
    },
    enabled: !!user,
  });

  const updateTaxSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<TaxSettings, 'id' | 'user_id' | 'created_at'>>) => {
      if (!user) throw new Error('No user found');
      
      // Try to update first, if no record exists, create one
      const { data: existingData } = await supabase
        .from('tax_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingData) {
        const { data, error } = await supabase
          .from('tax_settings')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tax_settings')
          .insert({ ...updates, user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings', user?.id] });
    },
  });

  return {
    taxSettings,
    isLoading,
    updateTaxSettings,
    getTaxRate: () => taxSettings ? getTaxRateByProvince(taxSettings.province) : 50.00,
  };
};
