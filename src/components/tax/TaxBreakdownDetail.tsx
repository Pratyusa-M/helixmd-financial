
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaxBreakdownDetailProps {
  taxableIncome: number;
  afterTaxIncome: number;
  currentYear: number;
}

export const TaxBreakdownDetail = ({ 
  taxableIncome, 
  afterTaxIncome, 
  currentYear 
}: TaxBreakdownDetailProps) => {
  return (
    <Card className="border-teal-200">
      <CardHeader>
        <CardTitle className="text-teal-900">Tax Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Federal Tax Calculation</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>First $55,867: ${(Math.min(taxableIncome, 55867) * 0.15).toLocaleString()} (15%)</div>
                {taxableIncome > 55867 && (
                  <div>Next ${Math.min(taxableIncome - 55867, 55866).toLocaleString()}: ${(Math.min(taxableIncome - 55867, 55866) * 0.205).toLocaleString()} (20.5%)</div>
                )}
                {taxableIncome > 111733 && (
                  <div>Next ${Math.min(taxableIncome - 111733, 61472).toLocaleString()}: ${(Math.min(taxableIncome - 111733, 61472) * 0.26).toLocaleString()} (26%)</div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Ontario Tax Calculation</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>First $51,446: ${(Math.min(taxableIncome, 51446) * 0.0505).toLocaleString()} (5.05%)</div>
                {taxableIncome > 51446 && (
                  <div>Next ${Math.min(taxableIncome - 51446, 51448).toLocaleString()}: ${(Math.min(taxableIncome - 51446, 51448) * 0.0915).toLocaleString()} (9.15%)</div>
                )}
                {taxableIncome > 102894 && (
                  <div>Next ${Math.min(taxableIncome - 102894, 47106).toLocaleString()}: ${(Math.min(taxableIncome - 102894, 47106) * 0.1116).toLocaleString()} (11.16%)</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                After-Tax Income: <span className="text-teal-600">${afterTaxIncome.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">
                This is an estimate based on 2024 tax brackets and your actual business expenses from {currentYear}.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
