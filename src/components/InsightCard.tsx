import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from "lucide-react";

interface InsightCardProps {
  taxSavings: number;
}

export const InsightCard = ({ taxSavings }: InsightCardProps) => {
  const formattedSavings = Math.round(taxSavings).toLocaleString();
  
  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  You saved <span className="text-2xl font-bold text-green-600">${formattedSavings}</span> in taxes this year using HelixMD!
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Based on your current income and expenses. We calculate your estimated tax savings using Ontario and Federal tax rates.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-600 mt-1">(so far!)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};