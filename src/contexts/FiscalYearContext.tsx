import React, { createContext, useContext, useState } from 'react';

interface FiscalYearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  startDate: string;
  endDate: string;
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

export const FiscalYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      return new Date().getFullYear();
    } catch (error) {
      console.error('Error getting current year:', error);
      return 2025; // fallback
    }
  });

  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  console.log('FiscalYearProvider render:', { selectedYear, startDate, endDate });

  return (
    <FiscalYearContext.Provider value={{
      selectedYear,
      setSelectedYear,
      startDate,
      endDate
    }}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = () => {
  const context = useContext(FiscalYearContext);
  if (context === undefined) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};