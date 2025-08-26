import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Plus, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useTaxInstalments } from "@/hooks/useTaxInstalments";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategorizedDeductions } from "@/hooks/useCategorizedDeductions";
import { AddTaxInstalmentModal } from "@/components/AddTaxInstalmentModal";
import { EditTaxInstalmentModal } from "@/components/EditTaxInstalmentModal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type TaxInstalment = Tables<"tax_instalments">;

export function TaxInstalmentsCard() {
  const { taxInstalments, isLoading, deleteTaxInstalment } = useTaxInstalments();
  const { taxSettings, isLoading: isLoadingSettings } = useTaxSettings();
  const { transactions } = useTransactions();
  const { toast } = useToast();
  
  // State for edit modal and delete confirmation
  const [editingInstalment, setEditingInstalment] = useState<TaxInstalment | null>(null);
  const [deletingInstalment, setDeletingInstalment] = useState<TaxInstalment | null>(null);
  
  // Use current year and get categorized deductions
  const currentYear = new Date().getFullYear();
  const categorizedDeductions = useCategorizedDeductions(transactions, currentYear);

  // Calculate projected total tax for estimate method
  const calculateProjectedTotalTax = () => {
    if (!transactions || !taxSettings) return 0;

    // Filter current year transactions
    const currentYearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear;
    });

    // Calculate total income YTD
    const totalIncomeYTD = currentYearTransactions
      .filter(t =>
        t.direction === 'credit' &&
        (t.category_override === 'business_income' ||
         (t.category_override === null && t.income_source !== null))
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Project annual income based on YTD performance
    const now = new Date();
    const monthsElapsed = now.getMonth() + 1; // Current month (1-12)
    const projectedTotalIncome = monthsElapsed > 0 ? (totalIncomeYTD / monthsElapsed) * 12 : 0;
    
    // Project annual business expenses based on YTD performance
    const businessExpensesYTD = categorizedDeductions.totalDeductions;
    const projectedExpenses = monthsElapsed > 0 ? (businessExpensesYTD / monthsElapsed) * 12 : 0;

    // Calculate projected taxable income
    const personalAmount = taxSettings.personal_tax_credit_amount || 15705;
    const netIncome = projectedTotalIncome - projectedExpenses;
    const taxableIncome = Math.max(0, netIncome - personalAmount);

    // Tax brackets (Ontario 2024 - same as in Dashboard)
    const federalBrackets = [
      { min: 0, max: 55867, rate: 0.15 },
      { min: 55867, max: 111733, rate: 0.205 },
      { min: 111733, max: 173205, rate: 0.26 },
      { min: 173205, max: 246752, rate: 0.29 },
      { min: 246752, max: Infinity, rate: 0.33 },
    ];
    
    const ontarioBrackets = [
      { min: 0, max: 51446, rate: 0.0505 },
      { min: 51446, max: 102894, rate: 0.0915 },
      { min: 102894, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: Infinity, rate: 0.1316 },
    ];

    // Calculate tax using progressive brackets
    const calculateTax = (income: number, brackets: any[]) => {
      let tax = 0;
      let remainingIncome = income;
      
      for (const bracket of brackets) {
        if (remainingIncome <= 0) break;
        
        const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
        tax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
      }
      
      return tax;
    };

    const federalTax = calculateTax(taxableIncome, federalBrackets);
    const ontarioTax = calculateTax(taxableIncome, ontarioBrackets);
    const totalProjectedTax = federalTax + ontarioTax;

    return totalProjectedTax;
  };

  // Calculate next expected payment
  const getNextExpectedPayment = () => {
    if (!taxSettings) return null;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Q3 due date is September 15
    const q3DueDate = new Date(currentYear, 8, 15); // Month is 0-indexed
    
    if (taxSettings.instalment_method === 'safe_harbour' && taxSettings.safe_harbour_total_tax_last_year) {
      const quarterlyAmount = taxSettings.safe_harbour_total_tax_last_year / 4;
      return {
        amount: quarterlyAmount,
        dueDate: q3DueDate,
        quarter: 'Q3',
        method: 'safe_harbour'
      };
    }

    // For estimated method, calculate projected tax and divide by 4
    if (taxSettings.instalment_method === 'estimate') {
      const projectedTotalTax = calculateProjectedTotalTax();
      const estimatedQuarterlyAmount = projectedTotalTax / 4;
      return {
        amount: estimatedQuarterlyAmount,
        dueDate: q3DueDate,
        quarter: 'Q3',
        method: 'estimate'
      };
    }

    return null;
  };

  // Handle delete instalment
  const handleDeleteInstalment = async (instalment: TaxInstalment) => {
    try {
      await deleteTaxInstalment.mutateAsync(instalment.id);
      toast({
        title: "Tax Instalment Deleted",
        description: "The tax instalment has been successfully deleted.",
      });
      setDeletingInstalment(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tax instalment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const nextPayment = getNextExpectedPayment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tax Instalments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tax Instalments
          </CardTitle>
          <AddTaxInstalmentModal>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Manual Tax Instalment
            </Button>
          </AddTaxInstalmentModal>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next Expected Payment */}
        {nextPayment && (
          <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Next Payment Due</h4>
                <p className="text-sm text-muted-foreground">
                  {nextPayment.quarter} • {format(nextPayment.dueDate, 'MMMM dd, yyyy')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  ${nextPayment.amount.toLocaleString()}
                </p>
                <Badge variant="outline" className="text-xs">
                  {nextPayment.method === 'safe_harbour' ? 'Safe Harbour' : 'Estimated'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Instalments List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Payment History</h4>
          
          {taxInstalments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tax instalments recorded yet</p>
              <p className="text-sm">Payments will appear here automatically when detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {taxInstalments.map((instalment) => (
                <div
                  key={instalment.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        ${Math.abs(instalment.amount).toLocaleString()}
                      </span>
                      <Badge 
                        variant={instalment.source === 'plaid' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {instalment.source}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {instalment.method === 'auto' ? 'Auto-detected' : instalment.method}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(instalment.date), 'MMM dd, yyyy')}
                    </p>
                    {instalment.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {instalment.notes}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions for manual entries only */}
                  {instalment.source === 'manual' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background z-50">
                        <DropdownMenuItem
                          onClick={() => setEditingInstalment(instalment)}
                          className="cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingInstalment(instalment)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Modal */}
      {editingInstalment && (
        <EditTaxInstalmentModal
          instalment={editingInstalment}
          open={!!editingInstalment}
          onOpenChange={(open) => !open && setEditingInstalment(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingInstalment} onOpenChange={(open) => !open && setDeletingInstalment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Instalment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tax instalment payment of{" "}
              <strong>${deletingInstalment?.amount.toLocaleString()}</strong> from{" "}
              <strong>{deletingInstalment && format(new Date(deletingInstalment.date), 'MMM dd, yyyy')}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingInstalment && handleDeleteInstalment(deletingInstalment)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaxInstalment.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}