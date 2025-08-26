import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useValidSubcategories } from "@/hooks/useValidSubcategories";
import type { Database } from '@/integrations/supabase/types';

type ExpenseType = Database['public']['Enums']['expense_type'];
type ExpenseCategory = Database['public']['Enums']['expense_category'];
type ExpenseSubcategory = Database['public']['Enums']['expense_subcategory'];

interface ValidSubcategorySelectorProps {
  expenseType?: ExpenseType;
  expenseCategory?: ExpenseCategory;
  value?: ExpenseSubcategory | null;
  onValueChange: (value: ExpenseSubcategory | null) => void;
  placeholder?: string;
  className?: string;
}

export const ValidSubcategorySelector = ({
  expenseType,
  expenseCategory,
  value,
  onValueChange,
  placeholder = "Select subcategory",
  className = "min-w-[260px] justify-between text-ellipsis whitespace-nowrap overflow-hidden"
}: ValidSubcategorySelectorProps) => {
  const { data: validSubcategories = [], isLoading } = useValidSubcategories(expenseType, expenseCategory);

  if (!expenseCategory) {
    return (
      <span className="text-gray-400 pl-3">Select category first</span>
    );
  }

  if (validSubcategories.length === 0 && !isLoading) {
    return (
      <span className="text-gray-400 pl-3">No subcategories</span>
    );
  }

  return (
    <Select
      value={value || "uncategorized"}
      onValueChange={(newValue) => 
        onValueChange(newValue === "uncategorized" ? null : newValue as ExpenseSubcategory)
      }
    >
      <SelectTrigger className={`${className} ${!value ? 'text-center' : 'text-left pl-3'}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="uncategorized" className="text-center">--</SelectItem>
        {validSubcategories.map(subcategory => (
          <SelectItem key={subcategory} value={subcategory}>
            {subcategory}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};