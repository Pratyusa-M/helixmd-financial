import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategorizedDeductions } from "@/hooks/useCategorizedDeductions";
import { format } from "date-fns";

export function CompactTaxInstalmentCard() {
  const { taxSettings, isLoading: isLoadingSettings } = useTaxSettings();
  const { transactions } = useTransactions();
  
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

    // Tax brackets (Ontario 2024)
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

  const nextPayment = getNextExpectedPayment();

  if (isLoadingSettings) {
    return (
      <Card>
        <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Next Tax Instalment Payment Due
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
    <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
      <CardContent className="p-6">
        {nextPayment ? (
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Next Tax Instalment Payment Due
              </p>
              <div className="text-2xl font-bold text-red-600 mb-1">
                ${nextPayment.amount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                Due {format(nextPayment.dueDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                Next Tax Instalment Payment Due
              </p>
              <p className="text-sm text-gray-600 mt-1">No upcoming payments</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}