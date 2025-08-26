
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TaxCreditsFormProps {
  personalAmount: number;
  otherCredits: number;
  onPersonalAmountChange: (value: number) => void;
  onOtherCreditsChange: (value: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const TaxCreditsForm = ({
  personalAmount,
  otherCredits,
  onPersonalAmountChange,
  onOtherCreditsChange,
  onSave,
  isSaving,
}: TaxCreditsFormProps) => {
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900">Tax Credits & Deductions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="personalAmount">Basic Personal Amount</Label>
          <Input
            id="personalAmount"
            type="number"
            value={personalAmount}
            onChange={(e) => onPersonalAmountChange(Number(e.target.value))}
            className="border-blue-200 focus:border-blue-400"
          />
          <p className="text-xs text-gray-500 mt-1">Federal basic personal amount for 2024</p>
        </div>
        
        <div>
          <Label htmlFor="otherCredits">Other Tax Credits</Label>
          <Input
            id="otherCredits"
            type="number"
            value={otherCredits}
            onChange={(e) => onOtherCreditsChange(Number(e.target.value))}
            className="border-blue-200 focus:border-blue-400"
          />
          <p className="text-xs text-gray-500 mt-1">Additional credits (RRSP, etc.)</p>
        </div>

        <Button 
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700 w-full"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Tax Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
