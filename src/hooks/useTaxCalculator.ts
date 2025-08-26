
import { useMemo } from 'react';

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface TaxCalculationResult {
  taxableIncome: number;
  federalTax: number;
  ontarioTax: number;
  totalTax: number;
  effectiveRate: number;
  afterTaxIncome: number;
}

export const useTaxCalculator = (
  netIncome: number,
  personalAmount: number,
  otherCredits: number
) => {
  // Ontario 2024 tax brackets
  const federalBrackets: TaxBracket[] = useMemo(() => [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Infinity, rate: 0.33 },
  ], []);
  
  const ontarioBrackets: TaxBracket[] = useMemo(() => [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ], []);
  
  const calculateTax = (income: number, brackets: TaxBracket[]) => {
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

  const calculation: TaxCalculationResult = useMemo(() => {
    const taxableIncome = Math.max(0, netIncome - personalAmount - otherCredits);
    const federalTax = calculateTax(taxableIncome, federalBrackets);
    const ontarioTax = calculateTax(taxableIncome, ontarioBrackets);
    const totalTax = federalTax + ontarioTax;
    const effectiveRate = netIncome > 0 ? (totalTax / netIncome * 100) : 0;
    const afterTaxIncome = netIncome - totalTax;

    return {
      taxableIncome,
      federalTax,
      ontarioTax,
      totalTax,
      effectiveRate,
      afterTaxIncome,
    };
  }, [netIncome, personalAmount, otherCredits, federalBrackets, ontarioBrackets]);

  return {
    calculation,
    federalBrackets,
    ontarioBrackets,
  };
};
