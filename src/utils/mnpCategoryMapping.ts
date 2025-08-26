export const MNP_CATEGORY_MAP = {
  "Professional Income": [ "OHIP", "Third Party", "Hospital", "Other Income" ],
  "Professional Expenses": [
    "Advertising and Promotion", "Answering Services", "Association Dues", "Bank Charges", "Billing", "Bookkeeping", "Computer/Software",
    "Dues and Subscriptions", "Insurance - Business", "Interest and Bank Charges", "Legal and Accounting", "Office Expenses", "Office Salaries",
    "Postage and Courier", "Rent", "Repairs and Maintenance", "Supplies", "Telephone", "Utilities", "Other Expenses"
  ],
  "Auto": [
    "Fuel", "Insurance", "Interest on Car Loan", "Lease Payments", "License", "Maintenance and Repairs", "Parking", "Other Auto Expenses"
  ],
  "Home Office": [
    "Electricity", "Heat", "Insurance", "Interest on Mortgage", "Maintenance", "Property Taxes", "Water", "Other Home Office Expenses"
  ],
  "Travel": [
    "Airfare", "Conference Fees", "Hotel", "Meals", "Taxi/Transport", "Other Travel"
  ],
  "Other": [
    "Capital Asset Purchases", "Personal Use Portion", "GST/HST Paid"
  ]
};

export type MNPCategoryKey = keyof typeof MNP_CATEGORY_MAP;

export const getMNPCategoryForSubcategory = (subcategory: string): MNPCategoryKey | null => {
  for (const [category, subcategories] of Object.entries(MNP_CATEGORY_MAP)) {
    if (subcategories.includes(subcategory)) {
      return category as MNPCategoryKey;
    }
  }
  return null;
};