import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ExportWarningDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  missingCategoryCount: number;
  missingSourceCount: number;
  missingExpenseCategoryCount: number;
  uncategorizedCount: number;
  totalCount: number;
}

export const ExportWarningDialog: React.FC<ExportWarningDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  missingCategoryCount,
  missingSourceCount,
  missingExpenseCategoryCount,
  uncategorizedCount,
  totalCount
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            ⚠️ Uncategorized Transactions Found
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Some transactions are missing categories and will be exported with default values:
            </p>
            
            <div className="space-y-2">
              {missingCategoryCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50">
                    {missingCategoryCount} missing income categories
                  </Badge>
                </div>
              )}
              {missingSourceCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50">
                    {missingSourceCount} missing income sources
                  </Badge>
                </div>
              )}
              {missingExpenseCategoryCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50">
                    {missingExpenseCategoryCount} missing expense categories
                  </Badge>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm">
                <strong>Export will include:</strong>
              </p>
              <ul className="text-sm mt-1 space-y-1">
                <li>• Main sheet: {totalCount - uncategorizedCount} properly categorized transactions</li>
                <li>• "Uncategorized" sheet: {uncategorizedCount} transactions with default "Personal" assignments</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              You can review and update categories before exporting, or proceed with the default assignments.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel Export</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Continue Export
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};