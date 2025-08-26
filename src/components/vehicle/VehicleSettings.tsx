
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Settings, Save, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

const VehicleSettings = () => {
  const { toast } = useToast();
  const { profile, updateProfile } = useProfile();
  
  const [settings, setSettings] = useState({
    vehicle_tracking_mode: "trip" as "trip" | "monthly",
    vehicle_deduction_method: "per_km" as "per_km" | "actual_expense",
    per_km_rate: 0.68,
    start_of_year_mileage: 0,
    current_mileage: 0,
  });

  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', profile);
      setSettings({
        vehicle_tracking_mode: profile.vehicle_tracking_mode || "trip",
        vehicle_deduction_method: profile.vehicle_deduction_method || "per_km",
        per_km_rate: profile.per_km_rate || 0.68,
        start_of_year_mileage: profile.start_of_year_mileage || 0,
        current_mileage: profile.current_mileage || 0,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      console.log('Saving settings:', settings);
      await updateProfile.mutateAsync(settings);
      toast({
        title: "Settings Updated",
        description: "Your vehicle tracking settings have been saved",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Vehicle Tracking Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="tracking_mode">How do you want to track your vehicle use?</Label>
          <Select 
            value={settings.vehicle_tracking_mode} 
            onValueChange={(value: "trip" | "monthly") => 
              setSettings(prev => ({ ...prev, vehicle_tracking_mode: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trip">Log each drive</SelectItem>
              <SelectItem value="monthly">Enter monthly total km</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            💡 Switching tracking methods won't delete past entries. You can switch back at any time.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="deduction_method">How do you plan to deduct your car for taxes?</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switching methods changes how deductions are calculated, but your mileage and logs are preserved.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select 
            value={settings.vehicle_deduction_method} 
            onValueChange={(value: "per_km" | "actual_expense") => 
              setSettings(prev => ({ ...prev, vehicle_deduction_method: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_km">Use CRA per-km rate</SelectItem>
              <SelectItem value="actual_expense">Deduct actual expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.vehicle_deduction_method === "per_km" && (
          <div>
            <Label htmlFor="per_km_rate">Per-KM Rate (CAD)</Label>
            <Input
              id="per_km_rate"
              type="number"
              step="0.01"
              min="0"
              value={settings.per_km_rate}
              onChange={(e) => setSettings(prev => ({ ...prev, per_km_rate: Number(e.target.value) }))}
            />
            <p className="text-xs text-gray-500 mt-1">Default: $0.68/km for 2025</p>
          </div>
        )}

        {settings.vehicle_deduction_method === "actual_expense" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Mileage Tracking</h3>
            
            <div>
              <Label htmlFor="start_of_year_mileage">Start of Year Mileage</Label>
              <Input
                id="start_of_year_mileage"
                type="number"
                min="0"
                value={settings.start_of_year_mileage}
                onChange={(e) => setSettings(prev => ({ ...prev, start_of_year_mileage: Number(e.target.value) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Your vehicle's odometer reading at the start of the tax year</p>
            </div>

            <div>
              <Label htmlFor="current_mileage">Current Mileage</Label>
              <Input
                id="current_mileage"
                type="number"
                min="0"
                value={settings.current_mileage}
                onChange={(e) => setSettings(prev => ({ ...prev, current_mileage: Number(e.target.value) }))}
              />
              <p className="text-xs text-gray-500 mt-1">Your vehicle's current odometer reading</p>
              {settings.current_mileage < settings.start_of_year_mileage && settings.current_mileage > 0 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Current mileage cannot be less than start of year mileage</p>
              )}
            </div>

            {settings.current_mileage > settings.start_of_year_mileage && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900">
                  Total KM This Year: {(settings.current_mileage - settings.start_of_year_mileage).toLocaleString()} km
                </p>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleSave}
          className="w-full"
          disabled={updateProfile.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateProfile.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VehicleSettings;
