import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInputValidation } from "./useInputValidation";
import { useRateLimiter } from "./useRateLimiter";
import { useAuditLogger } from "./useAuditLogger";
import { logger } from "@/utils/logger";

export interface CategorizationRule {
  id: string;
  user_id: string;
  match_type: 'contains' | 'equals';
  match_text: string;
  type: 'business_income' | 'business_expense' | 'personal_expense';
  category: string;
  subcategory?: string;
  created_at: string;
}

export const useCategorization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { validateCategoryRule, sanitizeInput } = useInputValidation();
  const { checkRateLimit } = useRateLimiter();
  const { logRuleCreation, logFailure, logSuccess } = useAuditLogger();

  const {
    data: rules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categorization-rules", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("transaction_categorization_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CategorizationRule[];
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async (newRule: Omit<CategorizationRule, "id" | "user_id" | "created_at">) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check rate limiting first
      const rateLimitPassed = await checkRateLimit('rule_creation');
      if (!rateLimitPassed) {
        throw new Error("Rate limit exceeded. Please wait before creating more rules.");
      }

      // Validate and sanitize input
      const validation = validateCategoryRule(newRule);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const sanitizedRule = {
        ...newRule,
        match_text: sanitizeInput(newRule.match_text),
        category: sanitizeInput(newRule.category),
        subcategory: newRule.subcategory ? sanitizeInput(newRule.subcategory) : undefined,
      };

      const { data, error } = await supabase
        .from("transaction_categorization_rules")
        .insert({
          ...sanitizedRule,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      logger.info("Categorization rule created successfully", { ruleId: data.id });
      
      // Log successful rule creation
      await logRuleCreation(sanitizedRule);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules", user?.id] });
    },
    onError: async (error) => {
      logger.error("Failed to create categorization rule", { error: error.message });
      await logFailure('rule_creation', error.message);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CategorizationRule> & { id: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("transaction_categorization_rules")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Log successful rule update
      await logSuccess('rule_update', { rule_id: id, updated_fields: Object.keys(updates) });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules", user?.id] });
    },
    onError: async (error) => {
      await logFailure('rule_update', error.message);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("transaction_categorization_rules")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Log successful rule deletion
      await logSuccess('rule_deletion', { rule_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorization-rules", user?.id] });
    },
    onError: async (error) => {
      await logFailure('rule_deletion', error.message);
    },
  });

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
  };
};