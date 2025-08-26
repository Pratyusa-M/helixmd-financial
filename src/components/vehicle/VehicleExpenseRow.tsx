
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface VehicleExpenseRowProps {
  row: {
    id: string;
    month: string;
    businessKm: number;
    method: string;
    deduction: number;
    type: "monthly" | "trip";
    trips?: any[];
  };
  trackingMode: string;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: (id: string) => void;
}

const VehicleExpenseRow = ({ 
  row, 
  trackingMode, 
  isExpanded, 
  onToggle, 
  onDelete 
}: VehicleExpenseRowProps) => {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="grid grid-cols-5 gap-4 p-4 border-b hover:bg-muted/25 transition-colors">
        <div className="flex items-center gap-2">
          {trackingMode === "trip" && row.trips && row.trips.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-4 w-4">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          <span>{row.month}</span>
        </div>
        <div>{row.businessKm.toFixed(1)} km</div>
        <div>
          <Badge variant="outline">
            {row.method === "per_km" ? "CRA rate" : "Actual expenses"}
          </Badge>
        </div>
        <div className="font-medium">
          {row.method === "per_km" 
            ? `$${row.deduction.toFixed(2)}` 
            : "See expenses"
          }
        </div>
        <div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Edit className="h-3 w-3" />
            </Button>
            {row.type === "monthly" && onDelete && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onDelete(row.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {trackingMode === "trip" && row.trips && row.trips.length > 0 && (
        <CollapsibleContent>
          <div className="bg-gray-50 border-b">
            <div className="grid grid-cols-5 gap-4 p-3 text-xs font-medium text-gray-600 border-b border-gray-200">
              <div>Date</div>
              <div>From</div>
              <div>To</div>
              <div>Distance</div>
              <div>Purpose</div>
            </div>
            
            {row.trips.map((trip) => (
              <div key={trip.id} className="grid grid-cols-5 gap-4 p-3 text-sm">
                <div>{new Date(trip.date).toLocaleDateString()}</div>
                <div>{trip.from_location || '-'}</div>
                <div>{trip.to_location || '-'}</div>
                <div>{trip.distance_km} km</div>
                <div>{trip.purpose || '-'}</div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};

export default VehicleExpenseRow;
