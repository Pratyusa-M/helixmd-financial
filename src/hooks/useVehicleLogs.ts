
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VehicleLog {
  id: string;
  user_id: string;
  date: string;
  from_location: string | null;
  to_location: string | null;
  distance_km: number;
  purpose: string | null;
  created_at: string;
}

export const useVehicleLogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: vehicleLogs = [], isLoading } = useQuery({
    queryKey: ['vehicleLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as VehicleLog[];
    },
    enabled: !!user,
  });

  const addVehicleLog = useMutation({
    mutationFn: async (log: Omit<VehicleLog, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs', user?.id] });
    },
  });

  const updateVehicleLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VehicleLog> }) => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs', user?.id] });
    },
  });

  const deleteVehicleLog = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('No user found');
      
      const { error } = await supabase
        .from('vehicle_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs', user?.id] });
    },
  });

  return {
    vehicleLogs,
    isLoading,
    addVehicleLog,
    updateVehicleLog,
    deleteVehicleLog,
  };
};
