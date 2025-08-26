import { useMemo } from 'react';
import { useTaxSettings } from './useTaxSettings';

export interface Instalment {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dueDate: Date;
  amount: number;
  isPaid: boolean;
  isOverdue: boolean;
}

export const useInstalments = () => {
  const { taxSettings } = useTaxSettings();

  const instalments = useMemo(() => {
    // Return empty array if not using safe harbour or no total tax amount
    if (!taxSettings || 
        taxSettings.instalment_method !== 'safe_harbour' || 
        !taxSettings.safe_harbour_total_tax_last_year) {
      return [];
    }

    const currentYear = new Date().getFullYear();
    const quarterlyAmount = taxSettings.safe_harbour_total_tax_last_year / 4;
    const today = new Date();
    
    // Define quarterly due dates for current year
    const dueDates = [
      { quarter: 'Q1' as const, date: new Date(currentYear, 2, 15) }, // March 15
      { quarter: 'Q2' as const, date: new Date(currentYear, 5, 15) }, // June 15
      { quarter: 'Q3' as const, date: new Date(currentYear, 8, 15) }, // September 15
      { quarter: 'Q4' as const, date: new Date(currentYear, 11, 15) }, // December 15
    ];

    // Create instalment objects
    const allInstalments: Instalment[] = dueDates.map(({ quarter, date }) => ({
      quarter,
      dueDate: date,
      amount: quarterlyAmount,
      isPaid: false, // TODO: This could be tracked in the database later
      isOverdue: date < today,
    }));

    return allInstalments;
  }, [taxSettings]);

  const upcomingInstalments = useMemo(() => {
    const today = new Date();
    
    // Filter to get upcoming (unpaid) instalments
    const upcoming = instalments.filter(instalment => {
      // Include if due date is today or in the future, or if overdue but unpaid
      return !instalment.isPaid && instalment.dueDate >= today;
    });

    // Sort by due date
    upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    // Return next 1-2 instalments
    return upcoming.slice(0, 2);
  }, [instalments]);

  const overdueInstalments = useMemo(() => {
    const today = new Date();
    
    return instalments.filter(instalment => 
      !instalment.isPaid && instalment.dueDate < today
    );
  }, [instalments]);

  const nextInstalment = upcomingInstalments[0] || null;
  
  const isEligibleForInstalments = useMemo(() => {
    return taxSettings?.instalment_method === 'safe_harbour' && 
           !!taxSettings?.safe_harbour_total_tax_last_year;
  }, [taxSettings]);

  const quarterlyAmount = useMemo(() => {
    if (!taxSettings?.safe_harbour_total_tax_last_year) return 0;
    return taxSettings.safe_harbour_total_tax_last_year / 4;
  }, [taxSettings?.safe_harbour_total_tax_last_year]);

  return {
    instalments,
    upcomingInstalments,
    overdueInstalments,
    nextInstalment,
    isEligibleForInstalments,
    quarterlyAmount,
    totalAnnualTax: taxSettings?.safe_harbour_total_tax_last_year || 0,
  };
};