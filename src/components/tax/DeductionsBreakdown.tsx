import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Car, Home, ParkingCircle, Building2 } from "lucide-react";
import { CategorizedDeductions } from "@/hooks/useCategorizedDeductions";

interface DeductionsBreakdownProps {
  deductions: CategorizedDeductions;
  currentYear: number;
}

export const DeductionsBreakdown = ({ deductions, currentYear }: DeductionsBreakdownProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'business':
        return <Building2 className="h-5 w-5" />;
      case 'parking':
        return <ParkingCircle className="h-5 w-5" />;
      case 'auto':
        return <Car className="h-5 w-5" />;
      case 'shared':
        return <Home className="h-5 w-5" />;
      default:
        return <Calculator className="h-5 w-5" />;
    }
  };

  const getColorClass = (category: string) => {
    switch (category) {
      case 'business':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'parking':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'auto':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'shared':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const deductionItems = [
    { key: 'business', ...deductions.breakdown.business },
    { key: 'parking', ...deductions.breakdown.parking },
    { key: 'auto', ...deductions.breakdown.auto },
    { key: 'shared', ...deductions.breakdown.shared }
  ].filter(item => item.amount > 0);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <Calculator className="h-5 w-5" />
          Tax Deductions Breakdown ({currentYear})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deductionItems.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No deductible expenses found for {currentYear}</p>
            <p className="text-sm">Add business expenses to see deductions here</p>
          </div>
        ) : (
          <>
            {deductionItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between p-4 rounded-lg border ${getColorClass(item.key)}`}
              >
                <div className="flex items-center gap-3">
                  {getIcon(item.key)}
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <Badge variant="outline" className="mt-1">
                      {item.percentage}% deductible
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900">Total Deductions</p>
                    <p className="text-sm text-emerald-700">Reduces your taxable income</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(deductions.totalDeductions)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};