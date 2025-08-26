import { useMutation } from "@tanstack/react-query";
import { useTransactions } from "./useTransactions";
import { useAuditLogger } from "./useAuditLogger";
import { CategorizationRule } from "./useCategorization";
import { logger } from "@/utils/logger";

interface ApplyRulesResult {
  matchedCount: number;
  updatedCount: number;
}

export const useRuleApplication = () => {
  const { transactions, updateTransaction } = useTransactions();
  const { logSuccess, logFailure } = useAuditLogger();

  const applyRules = useMutation({
    mutationFn: async ({ 
      rules, 
      lookbackDays = 365 
    }: { 
      rules: CategorizationRule[], 
      lookbackDays?: number 
    }): Promise<ApplyRulesResult> => {
      if (rules.length === 0) {
        return { matchedCount: 0, updatedCount: 0 };
      }

      // Calculate lookback date
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      // Get relevant transactions within lookback window
      const relevantTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const isWithinLookback = transactionDate >= lookbackDate;
        
        // Skip transactions with manual overrides (category_override present)
        const hasManualOverride = transaction.category_override !== null;
        
        // Skip already categorized transactions to avoid duplicates
        const isAlreadyCategorized = transaction.expense_category || 
                                   transaction.expense_subcategory || 
                                   transaction.income_source;
        
        return isWithinLookback && 
               !hasManualOverride && 
               !isAlreadyCategorized &&
               transaction.description;
      });

      let matchedCount = 0;
      let updatedCount = 0;
      const batchSize = 50; // Process in batches to avoid timeouts

      logger.info("Starting rule application", { 
        rulesCount: rules.length, 
        transactionsCount: relevantTransactions.length,
        lookbackDays 
      });

      // Process transactions in batches
      for (let i = 0; i < relevantTransactions.length; i += batchSize) {
        const batch = relevantTransactions.slice(i, i + batchSize);
        
        for (const transaction of batch) {
          if (!transaction.description) continue;

          const description = transaction.description.toLowerCase();
          
          // Find the first matching rule (rules are processed in order)
          for (const rule of rules) {
            const matchText = rule.match_text.toLowerCase();
            let isMatch = false;

            if (rule.match_type === 'contains') {
              isMatch = description.includes(matchText);
            } else if (rule.match_type === 'equals') {
              isMatch = description === matchText;
            }

            if (isMatch) {
              matchedCount++;
              
              const updates: any = {};
              
              if (rule.type === 'business_expense') {
                updates.expense_type = 'business';
                updates.expense_category = rule.category;
                if (rule.subcategory) {
                  updates.expense_subcategory = rule.subcategory;
                }
              } else if (rule.type === 'personal_expense') {
                updates.expense_type = 'personal';
                updates.expense_category = rule.category;
                if (rule.subcategory) {
                  updates.expense_subcategory = rule.subcategory;
                }
              } else if (rule.type === 'business_income') {
                updates.income_source = rule.category;
                // Set category_override if it's currently null
                if (transaction.category_override === null) {
                  updates.category_override = 'business_income';
                }
              }

              try {
                // Apply the update
                await updateTransaction.mutateAsync({ id: transaction.id, updates });
                updatedCount++;
                logger.info("Applied rule to transaction", { 
                  transactionId: transaction.id, 
                  ruleId: rule.id,
                  updates 
                });
              } catch (error) {
                logger.error("Failed to apply rule to transaction", { 
                  transactionId: transaction.id, 
                  ruleId: rule.id,
                  error: error.message 
                });
              }
              
              break; // Stop after first match
            }
          }
        }
      }

      const result = { matchedCount, updatedCount };
      
      // Log successful batch application
      await logSuccess('rule_creation', {
        action: 'rule_batch_application',
        rules_applied: rules.length,
        transactions_matched: matchedCount,
        transactions_updated: updatedCount,
        lookback_days: lookbackDays
      });

      logger.info("Rule application completed", result);
      return result;
    },
    onError: async (error) => {
      logger.error("Rule application failed", { error: error.message });
      await logFailure('rule_creation', error.message);
    },
  });

  return { applyRules };
};