import { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useTransactions } from './useTransactions';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface ExportTransaction {
  Date: string;
  Description: string;
  Category: string;
  Source: string;
  Amount: number;
  Account: string;
  Institution: string;
  Type: string;
}

interface ExportAnalysis {
  categorizedTransactions: ExportTransaction[];
  uncategorizedTransactions: ExportTransaction[];
  missingCategoryCount: number;
  missingSourceCount: number;
  missingExpenseCategoryCount: number;
}

export const useExcelExport = () => {
  const { transactions } = useTransactions();
  const { selectedYear } = useFiscalYear();

  const exportAnalysis = useMemo((): ExportAnalysis => {
    if (!transactions) return {
      categorizedTransactions: [],
      uncategorizedTransactions: [],
      missingCategoryCount: 0,
      missingSourceCount: 0,
      missingExpenseCategoryCount: 0
    };

    // Filter transactions for selected year
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });

    const categorized: ExportTransaction[] = [];
    const uncategorized: ExportTransaction[] = [];
    let missingCategoryCount = 0;
    let missingSourceCount = 0;
    let missingExpenseCategoryCount = 0;

    yearTransactions.forEach(transaction => {
      const isIncome = transaction.direction === 'credit';
      let isMissingCategories = false;

      // Check for missing categories
      if (isIncome) {
        if (!transaction.category_override) {
          missingCategoryCount++;
          isMissingCategories = true;
        }
        if (!transaction.income_source) {
          missingSourceCount++;
          isMissingCategories = true;
        }
      } else {
        if (!transaction.expense_category) {
          missingExpenseCategoryCount++;
          isMissingCategories = true;
        }
      }

      const exportTransaction: ExportTransaction = {
        Date: transaction.date || '',
        Description: transaction.description || '',
        Category: isIncome 
          ? (transaction.category_override || 'Personal')
          : (transaction.expense_category || 'Personal'),
        Source: isIncome 
          ? (transaction.income_source || 'Personal')
          : (transaction.expense_subcategory || ''),
        Amount: isIncome ? transaction.amount : -Math.abs(transaction.amount),
        Account: transaction.account_name || '',
        Institution: transaction.institution_name || '',
        Type: isIncome ? 'Income' : 'Expense'
      };

      if (isMissingCategories) {
        uncategorized.push(exportTransaction);
      } else {
        categorized.push(exportTransaction);
      }
    });

    // Sort by date (newest first)
    const sortByDate = (a: ExportTransaction, b: ExportTransaction) => 
      new Date(b.Date).getTime() - new Date(a.Date).getTime();

    return {
      categorizedTransactions: categorized.sort(sortByDate),
      uncategorizedTransactions: uncategorized.sort(sortByDate),
      missingCategoryCount,
      missingSourceCount,
      missingExpenseCategoryCount
    };
  }, [transactions, selectedYear]);

  const exportToExcel = () => {
    const { categorizedTransactions, uncategorizedTransactions } = exportAnalysis;
    
    if (categorizedTransactions.length === 0 && uncategorizedTransactions.length === 0) {
      throw new Error(`No transactions found for ${selectedYear}`);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create main transactions sheet
    if (categorizedTransactions.length > 0) {
      const ws = XLSX.utils.json_to_sheet(categorizedTransactions);
      
      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 40 }, // Description
        { wch: 20 }, // Category
        { wch: 20 }, // Source
        { wch: 15 }, // Amount
        { wch: 25 }, // Account
        { wch: 25 }, // Institution
        { wch: 10 }  // Type
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    }

    // Create uncategorized sheet if there are uncategorized transactions
    if (uncategorizedTransactions.length > 0) {
      // Add note at the top
      const noteData = [
        ["NOTE: These transactions were missing categories or sources and were assigned 'Personal' by default. Please review."],
        [""], // Empty row
        ...uncategorizedTransactions.map(t => Object.values(t))
      ];
      
      // Add headers
      const headers = Object.keys(uncategorizedTransactions[0]);
      noteData.splice(2, 0, headers);
      
      const ws = XLSX.utils.aoa_to_sheet(noteData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 40 }, // Description
        { wch: 20 }, // Category
        { wch: 20 }, // Source
        { wch: 15 }, // Amount
        { wch: 25 }, // Account
        { wch: 25 }, // Institution
        { wch: 10 }  // Type
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Uncategorized');
    }

    // Generate filename
    const filename = `HelixMD_Export_${selectedYear}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    return {
      filename,
      categorizedCount: categorizedTransactions.length,
      uncategorizedCount: uncategorizedTransactions.length,
      totalCount: categorizedTransactions.length + uncategorizedTransactions.length
    };
  };

  const exportSimpleTransactions = (year: number, userName?: string) => {
    if (!transactions) {
      throw new Error(`No transactions found for ${year}`);
    }

    // Filter transactions for selected year
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year;
    });

    if (yearTransactions.length === 0) {
      throw new Error(`No transactions found for ${year}`);
    }

    let uncategorizedCount = 0;

    // Map all transactions to a flat structure with proper categorization logic
    const flatTransactions = yearTransactions.map(transaction => {
      const isIncome = transaction.direction === 'credit';
      let category = '';
      let subcategory = '';
      
      if (isIncome) {
        // For income: use category_override, if missing set to "Uncategorized"
        if (transaction.category_override) {
          category = transaction.category_override;
          subcategory = transaction.income_source || '';
        } else {
          category = 'Uncategorized';
          subcategory = '';
          uncategorizedCount++;
        }
      } else {
        // For expenses: use expense_category, if missing set to "Uncategorized"
        if (transaction.expense_category) {
          category = transaction.expense_category;
          subcategory = transaction.expense_subcategory || '';
        } else {
          category = 'Uncategorized';
          subcategory = '';
          uncategorizedCount++;
        }
      }

      return {
        transaction_id: transaction.id,
        date: transaction.date,
        description: transaction.description || '',
        type: isIncome ? 'Income' : 'Expense',
        expense_type: transaction.expense_type || undefined,
        category: category,
        subcategory: subcategory || null,
        income_source: transaction.income_source || null,
        amount: Math.abs(transaction.amount), // Always positive as per interface
        currency: 'CAD',
        receipt: transaction.receipt_path ? true : false,
        notes: null, // Not currently stored in our schema
        account: transaction.account_name || '',
        institution: transaction.institution_name || '',
        plaid_source: true // All our transactions are from Plaid
      };
    });

    // Sort by date (newest first)
    const sortedTransactions = flatTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Create workbook
    const wb = XLSX.utils.book_new();
    const exportTimestamp = new Date().toISOString();

    // Add _ExportInfo sheet first
    const exportInfoSheet = XLSX.utils.aoa_to_sheet([
      ['Export Information'],
      ['User Name:', userName || 'Unknown User'],
      ['Export Timestamp (ISO):', exportTimestamp],
      ['Export Year:', year],
      ['Total Rows Exported:', sortedTransactions.length],
      ['Uncategorized Count:', uncategorizedCount],
      [''],
      ['Note: Uncategorized transactions are those missing category_override (income) or expense_category (expenses)']
    ]);
    
    // Style the export info sheet
    if (exportInfoSheet['A1']) {
      exportInfoSheet['A1'].s = { font: { bold: true, size: 14 } };
    }
    
    XLSX.utils.book_append_sheet(wb, exportInfoSheet, '_ExportInfo');

    // Add transactions sheet
    const ws = XLSX.utils.json_to_sheet(sortedTransactions);
    
    // Auto-size columns for the new interface structure
    const colWidths = [
      { wch: 36 }, // transaction_id
      { wch: 12 }, // date
      { wch: 40 }, // description
      { wch: 10 }, // type
      { wch: 15 }, // expense_type
      { wch: 20 }, // category
      { wch: 20 }, // subcategory
      { wch: 25 }, // income_source
      { wch: 15 }, // amount
      { wch: 8 },  // currency
      { wch: 10 }, // receipt
      { wch: 15 }, // notes
      { wch: 25 }, // account
      { wch: 20 }, // institution
      { wch: 12 }  // plaid_source
    ];
    ws['!cols'] = colWidths;

    // Format header row (row 1) - make it bold
    const headerRow = 1;
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D3D3D3" } }
      };
    }

    // Format Amount column (column I, index 8) as CAD currency
    const amountColIndex = 8; // 'amount' is the 9th column (0-indexed)
    for (let row = 2; row <= range.e.r + 1; row++) { // Start from row 2 (skip header)
      const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: amountColIndex });
      if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
        ws[cellAddress].z = '"$"#,##0.00_);("$"#,##0.00)'; // CAD currency format
      }
    }

    // Freeze the top row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Add auto-filter to all columns
    ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };
    
    XLSX.utils.book_append_sheet(wb, ws, `${year} Transactions`);

    // Generate filename
    const filename = `Simple_Transactions_${year}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    return {
      filename,
      totalCount: sortedTransactions.length,
      uncategorizedCount
    };
  };

  return {
    exportToExcel,
    exportSimpleTransactions,
    exportAnalysis,
    categorizedCount: exportAnalysis.categorizedTransactions.length,
    uncategorizedCount: exportAnalysis.uncategorizedTransactions.length,
    totalCount: exportAnalysis.categorizedTransactions.length + exportAnalysis.uncategorizedTransactions.length,
    hasUncategorized: exportAnalysis.uncategorizedTransactions.length > 0,
    missingCategoryCount: exportAnalysis.missingCategoryCount,
    missingSourceCount: exportAnalysis.missingSourceCount,
    missingExpenseCategoryCount: exportAnalysis.missingExpenseCategoryCount
  };
};