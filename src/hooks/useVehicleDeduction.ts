import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useTransactions } from './useTransactions';
import { useVehicleLogs } from './useVehicleLogs';
import { useMonthlyVehicleSummary } from './useMonthlyVehicleSummary';

export interface VehicleDeductionResult {
  deductionAmount: number;
  deductionType: 'per_km' | 'actual_expense';
  displayName: string;
  totalBusinessKm: number;
  autoExpensesTotal: number;
  filteredTransactions: any[]; // Transactions excluding auto expenses if using per_km
}

const AUTO_EXPENSE_SUBCATEGORIES = [
  'Gas',
  'Repairs', 
  'Insurance (Auto)',
  'Licensing Fees',
  'Parking',
  'Finance/Lease Payment'
];

export const useVehicleDeduction = (year: number = new Date().getFullYear()) => {
  const { profile } = useProfile();
  const { transactions } = useTransactions();
  const { vehicleLogs } = useVehicleLogs();
  const { monthlySummaries } = useMonthlyVehicleSummary();

  const vehicleDeduction: VehicleDeductionResult = useMemo(() => {
    const deductionMethod = profile?.vehicle_deduction_method || 'per_km';
    const perKmRate = profile?.per_km_rate || 0.68;
    const trackingMode = profile?.vehicle_tracking_mode || 'trip';

    // Filter transactions for the current year
    const currentYearTransactions = transactions?.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year;
    }) || [];

    // Calculate total business KM from either monthly summaries or vehicle logs
    let totalBusinessKm = 0;
    
    if (trackingMode === 'monthly') {
      const currentYearSummaries = monthlySummaries
        ?.filter(summary => {
          const summaryYear = new Date(summary.month).getFullYear();
          return summaryYear === year && summary.total_km && summary.total_km > 0;
        }) || [];
      
      console.log('useVehicleDeduction - Monthly tracking mode data:', {
        year,
        allSummaries: monthlySummaries,
        filteredSummaries: currentYearSummaries,
        summariesWithData: currentYearSummaries.map(s => ({
          month: s.month,
          business_km: s.business_km,
          total_km: s.total_km,
          ratio: s.total_km > 0 ? s.business_km / s.total_km : 0
        }))
      });
      
      totalBusinessKm = currentYearSummaries.reduce((sum, summary) => sum + summary.business_km, 0);
      
      const totalKmReported = currentYearSummaries.reduce((sum, summary) => sum + summary.total_km, 0);
      const businessUsePct = totalKmReported > 0 ? (totalBusinessKm / totalKmReported) * 100 : null;
      
      console.log('useVehicleDeduction - Business use calculation:', {
        totalBusinessKm,
        totalKmReported,
        businessUsePct: businessUsePct ? `${businessUsePct.toFixed(2)}%` : 'N/A'
      });
    } else {
      totalBusinessKm = vehicleLogs
        ?.filter(log => new Date(log.date).getFullYear() === year)
        ?.reduce((sum, log) => sum + log.distance_km, 0) || 0;
    }

    // Get auto-related expense transactions
    const autoExpenseTransactions = currentYearTransactions.filter(t => 
      t.expense_type === 'business' && 
      t.expense_category === 'Auto Expense' &&
      AUTO_EXPENSE_SUBCATEGORIES.includes(t.expense_subcategory || '')
    );

    const autoExpensesTotal = autoExpenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (deductionMethod === 'per_km') {
      // Per KM method: ignore auto expense transactions completely
      // Deduction = total_business_km * per_km_rate (e.g., 68¢)
      const deductionAmount = totalBusinessKm * perKmRate;
      
      // Filter out ALL auto expense transactions when using per_km method
      const filteredTransactions = currentYearTransactions.filter(t => 
        !(t.expense_type === 'business' && 
          t.expense_category === 'Auto Expense' &&
          AUTO_EXPENSE_SUBCATEGORIES.includes(t.expense_subcategory || ''))
      );

      return {
        deductionAmount,
        deductionType: 'per_km' as const,
        displayName: 'Vehicle Deduction (CRA rate)',
        totalBusinessKm,
        autoExpensesTotal,
        filteredTransactions
      };
    } else {
      // Actual expense method: use either monthly_vehicle_summary or vehicle_logs depending on tracking mode
      // 🅿️ Parking → always deducted at 100%
      // 🚗 All other auto expenses → multiplied by business_use %
      let deductionAmount = 0;
      
      // Separate parking from other auto expenses
      const parkingExpenses = autoExpenseTransactions.filter(t => t.expense_subcategory === 'Parking');
      const otherAutoExpenses = autoExpenseTransactions.filter(t => t.expense_subcategory !== 'Parking');
      
      const parkingTotal = parkingExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const otherAutoTotal = otherAutoExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      if (trackingMode === 'monthly') {
        // Use monthly_vehicle_summary when tracking mode is monthly
        const monthlyDeductions = monthlySummaries
          ?.filter(summary => new Date(summary.month).getFullYear() === year)
          ?.map(summary => {
            const monthKey = new Date(summary.month).toISOString().slice(0, 7); // YYYY-MM format
            
            // 🅿️ Parking expenses for this month (100% deductible)
            const monthParkingExpenses = parkingExpenses
              .filter(t => t.date.slice(0, 7) === monthKey)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            // 🚗 Other auto expenses for this month (multiplied by business_use %)
            const monthOtherAutoExpenses = otherAutoExpenses
              .filter(t => t.date.slice(0, 7) === monthKey)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            // Calculate business percentage for this month using business_km / total_km
            const businessPercentage = summary.total_km > 0 ? summary.business_km / summary.total_km : 0;
            
            return monthParkingExpenses + (monthOtherAutoExpenses * businessPercentage);
          }) || [];

        deductionAmount = monthlyDeductions.reduce((sum, deduction) => sum + deduction, 0);
      } else {
        // Use vehicle_logs when tracking mode is trip
        const startMileage = profile?.start_of_year_mileage || 0;
        const currentMileage = profile?.current_mileage || 0;
        const totalKmThisYear = currentMileage - startMileage;
        
        if (totalKmThisYear > 0 && totalBusinessKm > 0) {
          const businessUseRatio = totalBusinessKm / totalKmThisYear;
          // 🅿️ Parking is 100% deductible + 🚗 other auto expenses multiplied by business_use %
          deductionAmount = parkingTotal + (otherAutoTotal * businessUseRatio);
        } else {
          // Fallback: parking is still 100% deductible, but other auto expenses get 0%
          deductionAmount = parkingTotal;
        }
      }

      return {
        deductionAmount,
        deductionType: 'actual_expense' as const,
        displayName: 'Auto Expenses (Prorated)',
        totalBusinessKm,
        autoExpensesTotal,
        filteredTransactions: currentYearTransactions // Include all transactions for actual expense method
      };
    }
  }, [profile, transactions, vehicleLogs, monthlySummaries, year]);

  return vehicleDeduction;
};