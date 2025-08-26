
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyVehicleSummary } from "@/hooks/useMonthlyVehicleSummary";

const MonthlyForm = () => {
  const { toast } = useToast();
  const { addMonthlySummary } = useMonthlyVehicleSummary();
  
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    total_km: "",
    business_km: "",
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalKm = Number(formData.total_km);
    const businessKm = Number(formData.business_km);
    
    if (!totalKm || totalKm <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid total km",
        variant: "destructive",
      });
      return;
    }

    if (!businessKm || businessKm < 0 || businessKm > totalKm) {
      toast({
        title: "Error",
        description: "Business km must be between 0 and total km",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert YYYY-MM to YYYY-MM-01 for database storage
      const monthDate = `${formData.month}-01`;
      
      await addMonthlySummary.mutateAsync({
        month: monthDate,
        total_km: totalKm,
        business_km: businessKm,
        note: formData.note || null,
      });

      toast({
        title: "Monthly Summary Added",
        description: "Your monthly vehicle summary has been saved",
      });

      // Reset form
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        total_km: "",
        business_km: "",
        note: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add monthly summary. This month may already exist.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Monthly Vehicle Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_km">Total KM Driven</Label>
              <Input
                id="total_km"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.total_km}
                onChange={(e) => setFormData(prev => ({ ...prev, total_km: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="business_km">Business KM</Label>
              <Input
                id="business_km"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.business_km}
                onChange={(e) => setFormData(prev => ({ ...prev, business_km: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Additional notes about this month's driving"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={addMonthlySummary.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {addMonthlySummary.isPending ? "Adding..." : "Add Monthly Summary"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MonthlyForm;
