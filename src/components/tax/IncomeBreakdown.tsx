
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { VehicleDeductionResult } from "@/hooks/useVehicleDeduction";

interface IncomeBreakdownProps {
  totalIncome: number;
  totalBusinessExpenses: number;
  netIncome: number;
  currentYear: number;
  vehicleDeduction?: VehicleDeductionResult;
  sharedBusinessExpenses?: number;
  homeOfficePercentage?: number;
  parkingExpenses?: number;
}

export const IncomeBreakdown = ({ 
  totalIncome, 
  totalBusinessExpenses, 
  netIncome, 
  currentYear,
  vehicleDeduction,
  sharedBusinessExpenses = 0,
  homeOfficePercentage = 0,
  parkingExpenses = 0
}: IncomeBreakdownProps) => {
  return (
    <Card className="border-teal-200">
      <CardHeader>
        <CardTitle className="text-teal-900">Income Summary ({currentYear})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Income</span>
          <span className="font-semibold text-green-600">${totalIncome.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Business Expenses</span>
          <span className="font-semibold text-red-600">-${totalBusinessExpenses.toLocaleString()}</span>
        </div>
        
        {vehicleDeduction && vehicleDeduction.deductionAmount > 0 && (
          <div className="ml-4 space-y-2 text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <div className="flex justify-between">
              <span>Other business expenses:</span>
              <span>-${(totalBusinessExpenses - vehicleDeduction.deductionAmount - sharedBusinessExpenses - parkingExpenses).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700">
              <span>{vehicleDeduction.displayName}:</span>
              <span>-${vehicleDeduction.deductionAmount.toFixed(0)}</span>
            </div>
            {vehicleDeduction.deductionType === 'per_km' && vehicleDeduction.totalBusinessKm > 0 && (
              <div className="text-xs text-gray-400">
                {vehicleDeduction.totalBusinessKm.toFixed(1)} km × ${(vehicleDeduction.deductionAmount / vehicleDeduction.totalBusinessKm).toFixed(2)}/km
              </div>
            )}
            {parkingExpenses > 0 && (
              <div className="flex justify-between font-medium text-gray-700">
                <span>Parking Expenses:</span>
                <span>-${parkingExpenses.toFixed(0)}</span>
              </div>
            )}
            {sharedBusinessExpenses > 0 && (
              <>
                <div className="flex justify-between font-medium text-gray-700">
                  <div className="flex items-center gap-1">
                    <span>Shared Home Expenses (Prorated):</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Based on your {homeOfficePercentage}% home office setting</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>-${sharedBusinessExpenses.toFixed(0)}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {homeOfficePercentage}% of shared business expenses
                </div>
              </>
            )}
          </div>
        )}

        {!vehicleDeduction?.deductionAmount && sharedBusinessExpenses > 0 && (
          <div className="ml-4 space-y-2 text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <div className="flex justify-between">
              <span>Other business expenses:</span>
              <span>-${(totalBusinessExpenses - sharedBusinessExpenses - parkingExpenses).toLocaleString()}</span>
            </div>
            {parkingExpenses > 0 && (
              <div className="flex justify-between font-medium text-gray-700">
                <span>Parking Expenses:</span>
                <span>-${parkingExpenses.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-gray-700">
              <div className="flex items-center gap-1">
                <span>Shared Home Expenses (Prorated):</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on your {homeOfficePercentage}% home office setting</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span>-${sharedBusinessExpenses.toFixed(0)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {homeOfficePercentage}% of shared business expenses
            </div>
          </div>
        )}
        
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Net Income</span>
            <span className="font-bold text-blue-900">${netIncome.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
