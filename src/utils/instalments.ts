export interface InstalmentCalculation {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dueDate: Date;
  amount: number;
  isOverdue: boolean;
}

export interface InstalmentResult {
  nextInstalments: InstalmentCalculation[];
  overdueInstalments: InstalmentCalculation[];
  quarterlyAmount: number;
  isEligible: boolean;
}

/**
 * Calculates upcoming tax instalments for Safe Harbour method
 * @param instalmentMethod - The user's chosen instalment method
 * @param totalTaxLastYear - Total tax owed last year from Notice of Assessment
 * @returns Object containing next instalments and related information
 */
export function calculateInstalments(
  instalmentMethod: string | undefined,
  totalTaxLastYear: number | null | undefined
): InstalmentResult {
  // Default result for non-eligible users
  const defaultResult: InstalmentResult = {
    nextInstalments: [],
    overdueInstalments: [],
    quarterlyAmount: 0,
    isEligible: false,
  };

  // Check eligibility
  if (instalmentMethod !== 'safe_harbour' || !totalTaxLastYear) {
    return defaultResult;
  }

  const currentYear = new Date().getFullYear();
  const quarterlyAmount = totalTaxLastYear / 4;
  const today = new Date();
  
  // Define quarterly due dates for current year
  const dueDates = [
    { quarter: 'Q1' as const, date: new Date(currentYear, 2, 15) }, // March 15
    { quarter: 'Q2' as const, date: new Date(currentYear, 5, 15) }, // June 15
    { quarter: 'Q3' as const, date: new Date(currentYear, 8, 15) }, // September 15
    { quarter: 'Q4' as const, date: new Date(currentYear, 11, 15) }, // December 15
  ];

  // Create instalment calculations
  const instalments: InstalmentCalculation[] = dueDates.map(({ quarter, date }) => ({
    quarter,
    dueDate: date,
    amount: quarterlyAmount,
    isOverdue: date < today,
  }));

  // Separate upcoming and overdue instalments
  const upcomingInstalments = instalments
    .filter(instalment => instalment.dueDate >= today)
    .slice(0, 2); // Next 1-2 instalments

  const overdueInstalments = instalments
    .filter(instalment => instalment.isOverdue);

  return {
    nextInstalments: upcomingInstalments,
    overdueInstalments,
    quarterlyAmount,
    isEligible: true,
  };
}

/**
 * Gets the next due date for tax instalments
 * @param instalmentMethod - The user's chosen instalment method
 * @param totalTaxLastYear - Total tax owed last year
 * @returns Next due date or null if not applicable
 */
export function getNextInstalmentDueDate(
  instalmentMethod: string | undefined,
  totalTaxLastYear: number | null | undefined
): Date | null {
  const result = calculateInstalments(instalmentMethod, totalTaxLastYear);
  return result.nextInstalments[0]?.dueDate || null;
}

/**
 * Formats quarter name for display
 * @param quarter - Quarter identifier
 * @returns Formatted quarter name
 */
export function formatQuarterName(quarter: string): string {
  const quarterNames = {
    'Q1': '1st Quarter',
    'Q2': '2nd Quarter', 
    'Q3': '3rd Quarter',
    'Q4': '4th Quarter',
  };
  return quarterNames[quarter as keyof typeof quarterNames] || quarter;
}