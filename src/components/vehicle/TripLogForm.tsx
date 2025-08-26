
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Car, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicleLogs } from "@/hooks/useVehicleLogs";

const TripLogForm = () => {
  const { toast } = useToast();
  const { addVehicleLog } = useVehicleLogs();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    from_location: "",
    to_location: "",
    distance_km: "",
    purpose: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.distance_km || Number(formData.distance_km) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid distance",
        variant: "destructive",
      });
      return;
    }

    try {
      await addVehicleLog.mutateAsync({
        date: formData.date,
        from_location: formData.from_location || null,
        to_location: formData.to_location || null,
        distance_km: Number(formData.distance_km),
        purpose: formData.purpose || null,
      });

      toast({
        title: "Trip Added",
        description: "Your trip has been logged successfully",
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        from_location: "",
        to_location: "",
        distance_km: "",
        purpose: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add trip log",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Log New Trip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.distance_km}
                onChange={(e) => setFormData(prev => ({ ...prev, distance_km: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                placeholder="Starting location (optional)"
                value={formData.from_location}
                onChange={(e) => setFormData(prev => ({ ...prev, from_location: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                placeholder="Destination (optional)"
                value={formData.to_location}
                onChange={(e) => setFormData(prev => ({ ...prev, to_location: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              placeholder="e.g. locum, multi-clinic, CME (optional)"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={addVehicleLog.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {addVehicleLog.isPending ? "Adding..." : "Add Trip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripLogForm;
