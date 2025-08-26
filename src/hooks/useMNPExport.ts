import { useMemo } from 'react';
import ExcelJS from 'exceljs';
import { useTransactions } from './useTransactions';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MNP_CATEGORY_MAP, getMNPCategoryForSubcategory } from '@/utils/mnpCategoryMapping';

interface MNPTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  mnpCategory: string;
  isFlagged: boolean;
  account: string;
  institution: string;
  missingFields: string[];
}

interface MNPCategorySummary {
  [category: string]: {
    [subcategory: string]: number;
  };
}

export const useMNPExport = () => {
  const { transactions } = useTransactions();
  const { selectedYear } = useFiscalYear();
  const { user } = useAuth();

  const processedData = useMemo(() => {
    if (!transactions) return {
      processedTransactions: [],
      flaggedTransactions: [],
      categorySummary: {}
    };

    // Filter transactions for selected year
    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === selectedYear;
    });

    const processedTransactions: MNPTransaction[] = [];
    const flaggedTransactions: MNPTransaction[] = [];
    const categorySummary: MNPCategorySummary = {};

    // Initialize category summary structure
    Object.keys(MNP_CATEGORY_MAP).forEach(category => {
      categorySummary[category] = {};
      MNP_CATEGORY_MAP[category as keyof typeof MNP_CATEGORY_MAP].forEach(subcategory => {
        categorySummary[category][subcategory] = 0;
      });
    });

    yearTransactions.forEach(transaction => {
      const isIncome = transaction.direction === 'credit';
      let category = '';
      let subcategory = '';
      let isFlagged = false;
      const missingFields: string[] = [];

      if (isIncome) {
        // Income transactions
        category = transaction.category_override || 'Personal';
        subcategory = transaction.income_source || 'Personal';
        if (!transaction.category_override) {
          isFlagged = true;
          category = 'Personal';
          missingFields.push('Missing category');
        }
        if (!transaction.income_source) {
          isFlagged = true;
          subcategory = 'Personal';
          missingFields.push('Missing source');
        }
      } else {
        // Expense transactions
        category = transaction.expense_category || 'Personal';
        subcategory = transaction.expense_subcategory || 'Personal';
        if (!transaction.expense_category) {
          isFlagged = true;
          category = 'Personal';
          missingFields.push('Missing category');
        }
      }

      const mnpCategory = getMNPCategoryForSubcategory(subcategory);
      const amount = isIncome ? transaction.amount : -Math.abs(transaction.amount);

      const mnpTransaction: MNPTransaction = {
        date: transaction.date || '',
        description: transaction.description || '',
        amount,
        category,
        subcategory,
        mnpCategory,
        isFlagged,
        account: transaction.account_name || '',
        institution: transaction.institution_name || '',
        missingFields
      };

      if (isFlagged) {
        flaggedTransactions.push(mnpTransaction);
      } else {
        processedTransactions.push(mnpTransaction);
        
        // Add to category summary
        if (categorySummary[mnpCategory]) {
          if (!categorySummary[mnpCategory][subcategory]) {
            categorySummary[mnpCategory][subcategory] = 0;
          }
          categorySummary[mnpCategory][subcategory] += Math.abs(amount);
        }
      }
    });

    return {
      processedTransactions: processedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      flaggedTransactions: flaggedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      categorySummary
    };
  }, [transactions, selectedYear]);

  const generateMNPExport = async (year: number) => {
    const { processedTransactions, flaggedTransactions, categorySummary } = processedData;
    
    if (processedTransactions.length === 0 && flaggedTransactions.length === 0) {
      throw new Error(`No transactions found for ${year}`);
    }

    if (!user) {
      throw new Error('User must be logged in to export data');
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Subcategory', key: 'subcategory', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 }
    ];

    // Add summary data
    let rowIndex = 2;
    Object.keys(categorySummary).forEach(category => {
      // Add category header
      const categoryRow = summarySheet.getRow(rowIndex);
      categoryRow.getCell(1).value = category;
      categoryRow.getCell(1).font = { bold: true };
      categoryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      rowIndex++;

      let categoryTotal = 0;
      Object.keys(categorySummary[category]).forEach(subcategory => {
        const amount = categorySummary[category][subcategory];
        if (amount > 0) {
          const row = summarySheet.getRow(rowIndex);
          row.getCell(1).value = '';
          row.getCell(2).value = subcategory;
          row.getCell(3).value = amount;
          row.getCell(3).numFmt = '$#,##0.00';
          categoryTotal += amount;
          rowIndex++;
        }
      });

      // Add category total
      if (categoryTotal > 0) {
        const totalRow = summarySheet.getRow(rowIndex);
        totalRow.getCell(2).value = `${category} Total`;
        totalRow.getCell(2).font = { bold: true };
        totalRow.getCell(3).value = categoryTotal;
        totalRow.getCell(3).numFmt = '$#,##0.00';
        totalRow.getCell(3).font = { bold: true };
        totalRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }
        };
        rowIndex += 2;
      }
    });

    // Detailed Transactions Sheet
    const detailSheet = workbook.addWorksheet('Detailed Transactions');
    detailSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Subcategory', key: 'subcategory', width: 20 },
      { header: 'MNP Category', key: 'mnpCategory', width: 20 }
    ];

    // Add transaction data
    processedTransactions.forEach((transaction, index) => {
      const row = detailSheet.getRow(index + 2);
      row.getCell(1).value = transaction.date;
      row.getCell(2).value = transaction.description;
      row.getCell(3).value = transaction.amount;
      row.getCell(3).numFmt = '$#,##0.00';
      row.getCell(4).value = transaction.category;
      row.getCell(5).value = transaction.subcategory;
      row.getCell(6).value = transaction.mnpCategory;
    });

    // Flagged Transactions Sheet (if any)
    if (flaggedTransactions.length > 0) {
      const flaggedSheet = workbook.addWorksheet('Flagged Transactions');
      
      // Add warning note
      const noteRow = flaggedSheet.getRow(1);
      noteRow.getCell(1).value = 'WARNING: These transactions were missing categories or sources and were assigned "Personal" by default. Please review and recategorize.';
      noteRow.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } };
      flaggedSheet.mergeCells('A1:F1');

      flaggedSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Account', key: 'account', width: 25 },
        { header: 'Institution', key: 'institution', width: 25 },
        { header: 'Missing Fields', key: 'missingFields', width: 30 }
      ];

      // Set headers starting from row 3
      const headerRow = flaggedSheet.getRow(3);
      const headers = ['Date', 'Description', 'Amount', 'Account', 'Institution', 'Missing Fields'];
      headers.forEach((header, index) => {
        headerRow.getCell(index + 1).value = header;
        headerRow.getCell(index + 1).font = { bold: true };
      });

      // Add flagged transaction data
      flaggedTransactions.forEach((transaction, index) => {
        const row = flaggedSheet.getRow(index + 4);
        row.getCell(1).value = transaction.date;
        row.getCell(2).value = transaction.description;
        row.getCell(3).value = transaction.amount;
        row.getCell(3).numFmt = '$#,##0.00';
        row.getCell(4).value = transaction.account;
        row.getCell(5).value = transaction.institution;
        row.getCell(6).value = transaction.missingFields.join(', ');
      });
    }

    // Style headers for all sheets
    [summarySheet, detailSheet].forEach(sheet => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
    });

    // Generate filename and save
    const filename = `MNP_Export_${year}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create download link
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Log the export to the database
    try {
      const { error } = await supabase
        .from('mnp_exports')
        .insert({
          user_id: user.id,
          year: year,
          number_of_transactions: processedTransactions.length + flaggedTransactions.length,
          number_of_flagged_transactions: flaggedTransactions.length
        });

      if (error) {
        console.error('Failed to log MNP export:', error);
        // Don't throw error here as the export was successful, just logging failed
      }
    } catch (logError) {
      console.error('Failed to log MNP export:', logError);
    }

    return {
      filename,
      categorizedCount: processedTransactions.length,
      flaggedCount: flaggedTransactions.length,
      totalCount: processedTransactions.length + flaggedTransactions.length
    };
  };

  return {
    generateMNPExport,
    categorizedCount: processedData.processedTransactions.length,
    flaggedCount: processedData.flaggedTransactions.length,
    totalCount: processedData.processedTransactions.length + processedData.flaggedTransactions.length,
    hasFlagged: processedData.flaggedTransactions.length > 0
  };
};