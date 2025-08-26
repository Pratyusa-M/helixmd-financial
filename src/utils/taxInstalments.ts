import { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;

export interface TaxInstalmentExtraction {
  user_id: string;
  amount: number;
  date: string;
  method: string;
  source: string;
  notes: string;
}

/**
 * Extracts potential tax instalments from transaction data
 * @param transactions Array of transactions to analyze
 * @returns Array of tax instalment objects
 */
export function extractTaxInstalmentsFromTransactions(
  transactions: Transaction[]
): TaxInstalmentExtraction[] {
  const taxKeywords = ['cra', 'tax', 'instalment'];
  
  return transactions
    .filter((transaction) => {
      // Filter by direction and amount
      if (transaction.direction !== 'debit' || !transaction.amount || transaction.amount <= 100) {
        return false;
      }
      
      // Filter by description containing tax-related keywords
      if (!transaction.description) {
        return false;
      }
      
      const descriptionLower = transaction.description.toLowerCase();
      return taxKeywords.some(keyword => descriptionLower.includes(keyword));
    })
    .map((transaction) => ({
      user_id: transaction.user_id!,
      amount: Math.abs(transaction.amount!), // Ensure positive amount
      date: transaction.date!,
      method: 'estimated',
      source: 'plaid',
      notes: transaction.description!
    }))
    .filter((instalment) => instalment.user_id && instalment.date); // Ensure required fields exist
}

/**
 * Check if a date is within ±7 days of CRA quarterly due dates
 * @param date The date to check
 * @returns boolean indicating if date is near a quarterly due date
 */
export function isNearQuarterlyDueDate(date: Date): boolean {
  const year = date.getFullYear();
  const quarterlyDueDates = [
    new Date(year, 2, 15), // March 15
    new Date(year, 5, 15), // June 15
    new Date(year, 8, 15), // September 15
    new Date(year, 11, 15), // December 15
  ];
  
  const dateTime = date.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  return quarterlyDueDates.some(dueDate => {
    const dueDateTime = dueDate.getTime();
    return Math.abs(dateTime - dueDateTime) <= sevenDays;
  });
}

/**
 * Extract CRA tax instalment payments based on description and date proximity to quarterly due dates
 * @param transactions Array of transactions to analyze
 * @returns Array of CRA tax instalment objects
 */
export function extractCRAQuarterlyPayments(
  transactions: Transaction[]
): TaxInstalmentExtraction[] {
  const craKeywords = ['cra', 'canada revenue agency'];
  
  return transactions
    .filter((transaction) => {
      // Filter by direction and amount
      if (transaction.direction !== 'debit' || !transaction.amount || transaction.amount <= 0) {
        return false;
      }
      
      // Filter by description containing CRA keywords
      if (!transaction.description) {
        return false;
      }
      
      const descriptionLower = transaction.description.toLowerCase();
      const containsCRA = craKeywords.some(keyword => descriptionLower.includes(keyword));
      
      if (!containsCRA) {
        return false;
      }
      
      // Check if transaction date is within ±7 days of quarterly due dates
      if (!transaction.date) {
        return false;
      }
      
      const transactionDate = new Date(transaction.date);
      return isNearQuarterlyDueDate(transactionDate);
    })
    .map((transaction) => ({
      user_id: transaction.user_id!,
      amount: Math.abs(transaction.amount!), // Ensure positive amount
      date: transaction.date!,
      method: 'auto',
      source: 'plaid',
      notes: 'Auto-tagged based on date and CRA match'
    }))
    .filter((instalment) => instalment.user_id && instalment.date); // Ensure required fields exist
}