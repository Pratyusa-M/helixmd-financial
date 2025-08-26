
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface TaxSummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

export const TaxSummaryCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  colorClass 
}: TaxSummaryCardProps) => {
  return (
    <Card className={`border-${colorClass}-200`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${colorClass}-600`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold text-${colorClass}-900`}>
          ${Math.round(value).toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};
