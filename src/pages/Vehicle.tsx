
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Settings, BarChart3 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import VehicleSettings from "@/components/vehicle/VehicleSettings";
import TripLogForm from "@/components/vehicle/TripLogForm";
import MonthlyForm from "@/components/vehicle/MonthlyForm";
import VehicleSummaryTable from "@/components/vehicle/VehicleSummaryTable";

const Vehicle = () => {
  const { profile } = useProfile();
  const trackingMode = profile?.vehicle_tracking_mode || "trip";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Expense Tracker</h1>
          <p className="text-gray-600">Track your business driving for tax deductions</p>
        </div>
      </div>

      <Tabs defaultValue="track" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="track" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Track Driving
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="track" className="space-y-6">
          {!profile ? (
            <Card>
              <CardHeader>
                <CardTitle>Setup Required</CardTitle>
                <CardDescription>
                  Please configure your vehicle tracking settings first.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {trackingMode === "trip" ? (
                <TripLogForm />
              ) : (
                <MonthlyForm />
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {trackingMode === "trip" ? (
                      <>
                        <p>• Log each business trip individually</p>
                        <p>• Include distance, locations, and purpose</p>
                        <p>• Monthly summaries are calculated automatically</p>
                      </>
                    ) : (
                      <>
                        <p>• Enter total and business kilometers for each month</p>
                        <p>• Add optional notes for record keeping</p>
                        <p>• One entry per month to avoid duplicates</p>
                      </>
                    )}
                    <p>• Deductions are calculated using your selected method</p>
                    <p>• All data is stored securely for tax purposes</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <VehicleSummaryTable />
        </TabsContent>

        <TabsContent value="settings">
          <VehicleSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vehicle;
