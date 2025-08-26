
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthlyVehicleSummary {
  id: string;
  user_id: string;
  month: string;
  total_km: number;
  business_km: number;
  note: string | null;
  created_at: string;
}

export const useMonthlyVehicleSummary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: monthlySummaries = [], isLoading } = useQuery({
    queryKey: ['monthlyVehicleSummary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('monthly_vehicle_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as MonthlyVehicleSummary[];
    },
    enabled: !!user,
  });

  const addMonthlySummary = useMutation({
    mutationFn: async (summary: Omit<MonthlyVehicleSummary, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('monthly_vehicle_summary')
        .insert({ ...summary, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVehicleSummary', user?.id] });
    },
  });

  const updateMonthlySummary = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MonthlyVehicleSummary> }) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('monthly_vehicle_summary')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVehicleSummary', user?.id] });
    },
  });

  const deleteMonthlySummary = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user found');
      
      const { error } = await supabase
        .from('monthly_vehicle_summary')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVehicleSummary', user?.id] });
    },
  });

  return {
    monthlySummaries,
    isLoading,
    addMonthlySummary,
    updateMonthlySummary,
    deleteMonthlySummary,
  };
};
