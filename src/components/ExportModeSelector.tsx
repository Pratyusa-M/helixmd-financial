import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportModeSelectorProps {
  onSimpleExport: () => Promise<void>;
  onMNPExport: () => Promise<void>;
  disabled?: boolean;
  totalCount: number;
  hasFlagged: boolean;
}

export const ExportModeSelector: React.FC<ExportModeSelectorProps> = ({
  onSimpleExport,
  onMNPExport,
  disabled = false,
  totalCount,
  hasFlagged
}) => {
  const [exportMode, setExportMode] = useState<"simple" | "mnp">("simple");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsOpen(false);
      
      if (exportMode === "simple") {
        await onSimpleExport();
      } else {
        await onMNPExport();
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          Export for Accountant
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalCount}
            </Badge>
          )}
          {hasFlagged && (
            <Badge variant="outline" className="ml-1 bg-yellow-50 text-yellow-700">
              ⚠️
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Mode</DialogTitle>
          <DialogDescription>
            Choose how you'd like to export your transaction data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={exportMode} onValueChange={(value) => setExportMode(value as "simple" | "mnp")}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="simple" id="simple" className="mt-1" />
              <div className="space-y-1 flex-1">
                <Label htmlFor="simple" className="flex items-center gap-2 font-medium">
                  <FileSpreadsheet className="h-4 w-4" />
                  Simple Raw Export
                  <Badge variant="outline" className="text-xs">Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Export all transactions in a simple Excel format with basic categorization. 
                  Perfect for most accountants and bookkeepers.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg opacity-60">
              <RadioGroupItem value="mnp" id="mnp" className="mt-1" disabled />
              <div className="space-y-1 flex-1">
                <Label htmlFor="mnp" className="flex items-center gap-2 font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  MNP Export Format
                  <Badge variant="secondary" className="text-xs">Beta</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Export in MNP's specialized format with detailed categorization and summary sheets.
                  Coming soon!
                </p>
              </div>
            </div>
          </RadioGroup>

          {hasFlagged && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Some transactions need attention</p>
                <p className="text-yellow-700">
                  Transactions without proper categorization will be marked for review.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};