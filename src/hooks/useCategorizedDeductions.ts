import { useMemo } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { useVehicleDeduction } from '@/hooks/useVehicleDeduction';
import { useProfile } from '@/hooks/useProfile';

export interface CategorizedDeductions {
  businessExpenses: number;
  parkingExpenses: number;
  autoExpenses: number;
  sharedBusinessExpenses: number;
  totalDeductions: number;
  breakdown: {
    business: {
      amount: number;
      description: string;
      percentage: number;
    };
    parking: {
      amount: number;
      description: string;
      percentage: number;
    };
    auto: {
      amount: number;
      description: string;
      percentage: number;
    };
    shared: {
      amount: number;
      description: string;
      percentage: number;
    };
  };
}

export const useCategorizedDeductions = (
  transactions: Transaction[],
  currentYear: number
): CategorizedDeductions => {
  const { profile } = useProfile();
  const vehicleDeduction = useVehicleDeduction(currentYear);

  return useMemo(() => {
    // Filter transactions for current year
    const currentYearTransactions = transactions?.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === currentYear;
    }) || [];

    // 1. Business Expenses (100% deductible, excluding Auto and Parking)
    const businessExpenses = currentYearTransactions
      .filter(t => 
        t.expense_type === 'business' && 
        t.expense_category !== 'Auto Expense' && 
        t.expense_category !== 'Parking'
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 2. Parking Expenses (100% deductible)
    const parkingExpenses = currentYearTransactions
      .filter(t => t.expense_category === 'Parking' && t.expense_type !== 'internal_transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 3. Auto Expenses (only if actual expense method, prorated by business use)
    let autoExpenses = 0;
    let businessUsePct = 0;
    
    if (profile?.vehicle_deduction_method === 'actual_expense') {
      const autoTransactions = currentYearTransactions
        .filter(t => t.expense_category === 'Auto Expense' && t.expense_type !== 'internal_transfer')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate business use percentage based on tracking mode
      if (profile?.vehicle_tracking_mode === 'monthly') {
        // For monthly tracking, get the overall business percentage from vehicle summaries
        const currentYearSummaries = vehicleDeduction.filteredTransactions;
        const totalKm = currentYearSummaries.reduce((sum: number, s: any) => sum + (s.total_km || 0), 0);
        const businessKm = currentYearSummaries.reduce((sum: number, s: any) => sum + (s.business_km || 0), 0);
        businessUsePct = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;
      } else {
        // For trip tracking, calculate from total vs business km
        const startMileage = profile?.start_of_year_mileage || 0;
        const currentMileage = profile?.current_mileage || 0;
        const totalKmThisYear = currentMileage - startMileage;
        businessUsePct = totalKmThisYear > 0 ? (vehicleDeduction.totalBusinessKm / totalKmThisYear) * 100 : 0;
      }
      
      autoExpenses = autoTransactions * (businessUsePct / 100);
    }

    // 4. Shared Business Expenses (prorated by home office percentage)
    const homeOfficePercentage = profile?.home_office_percentage || 0;
    const sharedBusinessExpenses = homeOfficePercentage > 0 
      ? currentYearTransactions
          .filter(t => t.expense_category === 'Shared Business' && t.expense_type !== 'internal_transfer')
          .reduce((sum, t) => sum + (Math.abs(t.amount) * (homeOfficePercentage / 100)), 0)
      : 0;

    // 5. Vehicle deduction (per-km method)
    const vehicleDeductionAmount = profile?.vehicle_deduction_method === 'per_km' 
      ? vehicleDeduction.deductionAmount 
      : 0;

    const totalDeductions = businessExpenses + parkingExpenses + autoExpenses + sharedBusinessExpenses + vehicleDeductionAmount;

    const breakdown = {
      business: {
        amount: businessExpenses,
        description: 'Business Expenses (100%)',
        percentage: 100
      },
      parking: {
        amount: parkingExpenses,
        description: 'Parking (100%)',
        percentage: 100
      },
      auto: {
        amount: profile?.vehicle_deduction_method === 'actual_expense' ? autoExpenses : vehicleDeductionAmount,
        description: profile?.vehicle_deduction_method === 'actual_expense' 
          ? `Auto Expenses (${businessUsePct.toFixed(1)}% business use)`
          : `Vehicle Deductions`,
        percentage: profile?.vehicle_deduction_method === 'actual_expense'
          ? businessUsePct
          : 100
      },
      shared: {
        amount: sharedBusinessExpenses,
        description: `Home Office Expenses (${homeOfficePercentage}%)`,
        percentage: homeOfficePercentage
      }
    };

    return {
      businessExpenses,
      parkingExpenses,
      autoExpenses: profile?.vehicle_deduction_method === 'actual_expense' ? autoExpenses : vehicleDeductionAmount,
      sharedBusinessExpenses,
      totalDeductions,
      breakdown
    };
  }, [transactions, currentYear, profile, vehicleDeduction]);
};