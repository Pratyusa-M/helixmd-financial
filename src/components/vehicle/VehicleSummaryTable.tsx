
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useVehicleLogs } from "@/hooks/useVehicleLogs";
import { useMonthlyVehicleSummary } from "@/hooks/useMonthlyVehicleSummary";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { calculateMonthlyData } from "@/utils/vehicle";
import VehicleExpenseRow from "./VehicleExpenseRow";
import VehicleExpenseSummary from "./VehicleExpenseSummary";

const VehicleSummaryTable = () => {
  const { profile } = useProfile();
  const { vehicleLogs } = useVehicleLogs();
  const { monthlySummaries, deleteMonthlySummary } = useMonthlyVehicleSummary();
  const { toast } = useToast();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const trackingMode = profile?.vehicle_tracking_mode || "trip";
  const deductionMethod = profile?.vehicle_deduction_method || "per_km";
  const perKmRate = profile?.per_km_rate || 0.68;

  const toggleMonth = (monthId: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthId)) {
      newExpanded.delete(monthId);
    } else {
      newExpanded.add(monthId);
    }
    setExpandedMonths(newExpanded);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMonthlySummary.mutateAsync(id);
      toast({
        title: "Deleted",
        description: "Monthly summary has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete summary",
        variant: "destructive",
      });
    }
  };

  const monthlyData = calculateMonthlyData(
    trackingMode,
    monthlySummaries,
    vehicleLogs,
    deductionMethod,
    perKmRate
  );

  console.log('Final monthly data for display:', monthlyData);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Deduction Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Use Statistics */}
        <div className="bg-muted/25 p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Usage Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Total KM Driven (YTD) */}
            <div>
              <Label className="text-sm font-medium">Total KM Driven (YTD)</Label>
              <div className="text-xl font-semibold">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  let totalKmYTD = 0;
                  
                  if (trackingMode === "monthly") {
                    // For monthly mode: sum of total_km from monthly_vehicle_summary
                    const summaries = monthlySummaries?.filter(summary => {
                      const summaryYear = new Date(summary.month).getFullYear();
                      return summaryYear === currentYear && 
                             summary.total_km !== null && 
                             summary.total_km !== undefined && 
                             summary.total_km > 0;
                    }) || [];
                    
                    if (summaries.length === 0) return "—";
                    
                    totalKmYTD = summaries.reduce((sum, s) => sum + s.total_km, 0);
                  } else {
                    // For trip mode: use odometer readings
                    const startMileage = profile?.start_of_year_mileage || 0;
                    const currentMileage = profile?.current_mileage || 0;
                    totalKmYTD = currentMileage - startMileage;
                    
                    if (startMileage === 0 || currentMileage === 0 || totalKmYTD <= 0) {
                      return "—";
                    }
                  }
                  
                  if (totalKmYTD === 0 || totalKmYTD === null) return "—";
                  
                  return `${totalKmYTD.toLocaleString()} km`;
                })()}
              </div>
            </div>

            {/* Business Use % */}
            <div>
              <Label className="text-sm font-medium">Business Use %</Label>
              <div className="text-xl font-semibold">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  
                  // Always use odometer values for total KM
                  const startMileage = profile?.start_of_year_mileage || 0;
                  const currentMileage = profile?.current_mileage || 0;
                  const totalKmYTD = currentMileage - startMileage;
                  
                  if (startMileage === 0 || currentMileage === 0 || totalKmYTD <= 0) {
                    return "—";
                  }
                  
                  let totalBusinessKm = 0;
                  
                  if (trackingMode === "monthly") {
                    // Use business_km from monthly summaries
                    const summaries = monthlySummaries?.filter(summary => {
                      const summaryYear = new Date(summary.month).getFullYear();
                      return summaryYear === currentYear;
                    }) || [];
                    
                    totalBusinessKm = summaries.reduce((sum, s) => sum + s.business_km, 0);
                  } else {
                    // Use business_km from vehicle logs
                    const currentYearLogs = vehicleLogs?.filter(log => {
                      const logYear = new Date(log.date).getFullYear();
                      return logYear === currentYear;
                    }) || [];
                    
                    totalBusinessKm = currentYearLogs.reduce((sum, log) => sum + log.distance_km, 0);
                  }
                  
                  const businessUsePct = (totalBusinessKm / totalKmYTD) * 100;
                  
                  // Console log for debugging
                  console.log('Business Use % Calculation:', {
                    totalKmYTD,
                    totalBusinessKm,
                    businessUsePct
                  });
                  
                  return `${businessUsePct.toFixed(1)}%`;
                })()}
              </div>
              {(() => {
                // High business use warning - only show for calculated percentages
                const currentYear = new Date().getFullYear();
                
                // Always use odometer values for total KM
                const startMileage = profile?.start_of_year_mileage || 0;
                const currentMileage = profile?.current_mileage || 0;
                const totalKmYTD = currentMileage - startMileage;
                
                if (startMileage === 0 || currentMileage === 0 || totalKmYTD <= 0) return null;
                
                let totalBusinessKm = 0;
                
                if (trackingMode === "monthly") {
                  // Use business_km from monthly summaries
                  const summaries = monthlySummaries?.filter(summary => {
                    const summaryYear = new Date(summary.month).getFullYear();
                    return summaryYear === currentYear;
                  }) || [];
                  
                  totalBusinessKm = summaries.reduce((sum, s) => sum + s.business_km, 0);
                } else {
                  // Use business_km from vehicle logs
                  const currentYearLogs = vehicleLogs?.filter(log => {
                    const logYear = new Date(log.date).getFullYear();
                    return logYear === currentYear;
                  }) || [];
                  
                  totalBusinessKm = currentYearLogs.reduce((sum, log) => sum + log.distance_km, 0);
                }
                
                const businessUsePct = (totalBusinessKm / totalKmYTD) * 100;
                
                if (businessUsePct > 90) {
                  return (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <span className="font-medium">⚠️ High Business Use:</span> Your logged vehicle use is over 90% business. CRA may scrutinize this — be sure you've excluded all personal trips.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Monthly Deduction Summary */}
        <div className="w-full">
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
            <div>Month</div>
            <div>Business KM</div>
            <div>Method</div>
            <div>Deduction</div>
            <div>Action</div>
          </div>

          {/* Data Rows */}
          {monthlyData.map((row) => (
            <VehicleExpenseRow
              key={row.id}
              row={row}
              trackingMode={trackingMode}
              isExpanded={expandedMonths.has(row.id)}
              onToggle={() => toggleMonth(row.id)}
              onDelete={row.type === "monthly" ? handleDelete : undefined}
            />
          ))}

          {/* Summary Row */}
          <VehicleExpenseSummary 
            monthlyData={monthlyData} 
            trackingMode={trackingMode}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleSummaryTable;
