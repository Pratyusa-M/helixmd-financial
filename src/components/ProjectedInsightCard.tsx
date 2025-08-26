import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from "lucide-react";

interface ProjectedInsightCardProps {
  projectedTaxSavings: number;
}

export const ProjectedInsightCard = ({ projectedTaxSavings }: ProjectedInsightCardProps) => {
  const formattedSavings = Math.round(projectedTaxSavings).toLocaleString();
  
  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  You're on track to save <span className="text-2xl font-bold text-blue-600">${formattedSavings}</span> in taxes this year using HelixMD!
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Based on your projected annual income and expenses using the last 6 months of data. Calculation uses Ontario and Federal tax rates.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-600 mt-1">(projected annual savings)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};