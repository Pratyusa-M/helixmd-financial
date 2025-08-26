
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      console.log('Profile fetched:', data);
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: { 
      name?: string;
      vehicle_tracking_mode?: 'trip' | 'monthly';
      vehicle_deduction_method?: 'per_km' | 'actual_expense';
      per_km_rate?: number;
      start_of_year_mileage?: number;
      current_mileage?: number;
      home_office_percentage?: number;
    }) => {
      if (!user) throw new Error('No user found');
      
      console.log('Updating profile with:', updates);
      
      // Check if switching from trip to monthly mode
      const currentProfile = profile;
      const switchingToMonthly = currentProfile?.vehicle_tracking_mode === 'trip' && 
                                updates.vehicle_tracking_mode === 'monthly';
      
      // Use upsert to either update existing profile or create new one
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, ...updates },
          { onConflict: 'id' }
        )
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      // If switching to monthly mode, auto-fill monthly summaries from trip data
      if (switchingToMonthly) {
        console.log('Switching to monthly mode - auto-filling summaries from trip data');
        
        // Get all vehicle logs for this user
        const { data: vehicleLogs, error: logsError } = await supabase
          .from('vehicle_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (logsError) {
          console.error('Error fetching vehicle logs:', logsError);
          // Don't throw here - profile update succeeded, this is just a bonus feature
        } else if (vehicleLogs && vehicleLogs.length > 0) {
          console.log('Found', vehicleLogs.length, 'vehicle logs to process');
          
          // Group logs by month and sum distance
          const monthlyData: { [key: string]: number } = {};
          
          vehicleLogs.forEach(log => {
            const logDate = new Date(log.date);
            const monthKey = `${logDate.getFullYear()}-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + log.distance_km;
          });
          
          console.log('Monthly data to create:', monthlyData);
          
          // Create monthly summary entries for each month with trip data
          const monthlySummaryPromises = Object.entries(monthlyData).map(async ([month, businessKm]) => {
            // Check if this month already exists
            const { data: existing } = await supabase
              .from('monthly_vehicle_summary')
              .select('id')
              .eq('user_id', user.id)
              .eq('month', month)
              .maybeSingle();
            
            // Only create if doesn't already exist
            if (!existing) {
              console.log('Creating monthly summary for', month, 'with', businessKm, 'km');
              const { error: insertError } = await supabase
                .from('monthly_vehicle_summary')
                .insert({
                  user_id: user.id,
                  month,
                  business_km: businessKm,
                  total_km: businessKm, // Set total_km to business_km as a starting point
                  note: 'Auto-generated from trip logs'
                });
              
              if (insertError) {
                console.error('Error creating monthly summary for', month, ':', insertError);
              } else {
                console.log('Successfully created monthly summary for', month);
              }
            } else {
              console.log('Monthly summary for', month, 'already exists, skipping');
            }
          });
          
          await Promise.allSettled(monthlySummaryPromises);
          console.log('Finished processing monthly summaries');
        } else {
          console.log('No vehicle logs found to process');
        }
      }
      
      console.log('Profile updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['monthlyVehicleSummary', user?.id] });
      // Also invalidate vehicle logs in case they're displayed in the same view
      queryClient.invalidateQueries({ queryKey: ['vehicleLogs', user?.id] });
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
  };
};
