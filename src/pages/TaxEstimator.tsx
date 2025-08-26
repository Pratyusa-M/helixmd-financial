
import { useState, useEffect } from "react";
import { RefreshCw, Calculator, DollarSign, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { useTaxCalculator } from "@/hooks/useTaxCalculator";
import { useCategorizedDeductions } from "@/hooks/useCategorizedDeductions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { TaxSummaryCard } from "@/components/tax/TaxSummaryCard";
import { IncomeBreakdown } from "@/components/tax/IncomeBreakdown";

import { TaxBreakdownDetail } from "@/components/tax/TaxBreakdownDetail";
import { DeductionsBreakdown } from "@/components/tax/DeductionsBreakdown";

const TaxEstimator = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { taxSettings } = useTaxSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use 2025 as current year and dynamically adapt for future years
  const currentYear = new Date().getFullYear();
  
  // Use the new categorized deductions hook
  const categorizedDeductions = useCategorizedDeductions(transactions, currentYear);
  
  const [personalAmount, setPersonalAmount] = useState(15705);
  const [otherCredits, setOtherCredits] = useState(0);

  // Update local state when tax settings are loaded
  useEffect(() => {
    if (taxSettings) {
      setPersonalAmount(taxSettings.personal_tax_credit_amount || 15705);
      setOtherCredits((taxSettings as any).other_credits || 0);
    }
  }, [taxSettings]);

  // Calculate total income from current year transactions
  const currentYearTransactions = transactions?.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getFullYear() === currentYear;
  }) || [];

  const totalIncome = currentYearTransactions
    .filter(t => t.amount > 0 && t.expense_type === 'personal')
    .reduce((sum, t) => sum + t.amount, 0);

  // Use categorized deductions for total business expenses
  const totalBusinessExpenses = categorizedDeductions.totalDeductions;
  const netIncome = totalIncome - totalBusinessExpenses;
  
  const { calculation } = useTaxCalculator(netIncome, personalAmount, otherCredits);


  const handleRefreshData = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['taxSettings', user?.id] });
      toast({
        title: "Data Refreshed",
        description: "All data has been refreshed from the database",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Estimator</h1>
          <p className="text-gray-600">Estimate your tax obligations for Ontario ({currentYear})</p>
        </div>
        <Button onClick={handleRefreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeductionsBreakdown
          deductions={categorizedDeductions}
          currentYear={currentYear}
        />
      </div>


      {/* Tax Calculation Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TaxSummaryCard
          title="Taxable Income"
          value={calculation.taxableIncome}
          description="After deductions"
          icon={DollarSign}
          colorClass="blue"
        />

        <TaxSummaryCard
          title="Federal Tax"
          value={calculation.federalTax}
          description="Federal portion"
          icon={Calculator}
          colorClass="red"
        />

        <TaxSummaryCard
          title="Ontario Tax"
          value={calculation.ontarioTax}
          description="Provincial portion"
          icon={Calculator}
          colorClass="orange"
        />

        <TaxSummaryCard
          title="Total Tax"
          value={calculation.totalTax}
          description={`${calculation.effectiveRate.toFixed(1)}% effective rate`}
          icon={Percent}
          colorClass="purple"
        />
      </div>

      <TaxBreakdownDetail
        taxableIncome={calculation.taxableIncome}
        afterTaxIncome={calculation.afterTaxIncome}
        currentYear={currentYear}
      />
    </div>
  );
};

export default TaxEstimator;
