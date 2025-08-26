import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export const FiscalYearSelector: React.FC = () => {
  const { selectedYear, setSelectedYear } = useFiscalYear();
  
  const years = [2025, 2024];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Viewing:</span>
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => setSelectedYear(parseInt(value))}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};