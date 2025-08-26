export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_details: Json | null
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_subcategory_mapping: {
        Row: {
          expense_category: Database["public"]["Enums"]["expense_category"]
          expense_subcategory: Database["public"]["Enums"]["expense_subcategory"]
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
        }
        Insert: {
          expense_category: Database["public"]["Enums"]["expense_category"]
          expense_subcategory: Database["public"]["Enums"]["expense_subcategory"]
          expense_type: Database["public"]["Enums"]["expense_type"]
          id?: string
        }
        Update: {
          expense_category?: Database["public"]["Enums"]["expense_category"]
          expense_subcategory?: Database["public"]["Enums"]["expense_subcategory"]
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
        }
        Relationships: []
      }
      daily_rollups: {
        Row: {
          day: string
          expense_total: number
          income_total: number
          net_cashflow: number
          transfer_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          expense_total?: number
          income_total?: number
          net_cashflow?: number
          transfer_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          expense_total?: number
          income_total?: number
          net_cashflow?: number
          transfer_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingestion_events: {
        Row: {
          event_type: string
          id: string
          idempotency_key: string
          payload_hash: string
          processed_at: string | null
          received_at: string
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          idempotency_key: string
          payload_hash: string
          processed_at?: string | null
          received_at?: string
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          idempotency_key?: string
          payload_hash?: string
          processed_at?: string | null
          received_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mnp_exports: {
        Row: {
          created_at: string
          id: string
          number_of_flagged_transactions: number
          number_of_transactions: number
          timestamp: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          number_of_flagged_transactions?: number
          number_of_transactions?: number
          timestamp?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          number_of_flagged_transactions?: number
          number_of_transactions?: number
          timestamp?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_vehicle_summary: {
        Row: {
          business_km: number
          created_at: string | null
          id: string
          month: string
          note: string | null
          total_km: number
          user_id: string
        }
        Insert: {
          business_km: number
          created_at?: string | null
          id?: string
          month: string
          note?: string | null
          total_km: number
          user_id: string
        }
        Update: {
          business_km?: number
          created_at?: string | null
          id?: string
          month?: string
          note?: string | null
          total_km?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          current_mileage: number | null
          home_office_percentage: number | null
          id: string
          name: string | null
          per_km_rate: number | null
          start_of_year_mileage: number | null
          vehicle_deduction_method:
            | Database["public"]["Enums"]["vehicle_deduction_method"]
            | null
          vehicle_tracking_mode:
            | Database["public"]["Enums"]["vehicle_tracking_mode"]
            | null
        }
        Insert: {
          created_at?: string | null
          current_mileage?: number | null
          home_office_percentage?: number | null
          id: string
          name?: string | null
          per_km_rate?: number | null
          start_of_year_mileage?: number | null
          vehicle_deduction_method?:
            | Database["public"]["Enums"]["vehicle_deduction_method"]
            | null
          vehicle_tracking_mode?:
            | Database["public"]["Enums"]["vehicle_tracking_mode"]
            | null
        }
        Update: {
          created_at?: string | null
          current_mileage?: number | null
          home_office_percentage?: number | null
          id?: string
          name?: string | null
          per_km_rate?: number | null
          start_of_year_mileage?: number | null
          vehicle_deduction_method?:
            | Database["public"]["Enums"]["vehicle_deduction_method"]
            | null
          vehicle_tracking_mode?:
            | Database["public"]["Enums"]["vehicle_tracking_mode"]
            | null
        }
        Relationships: []
      }
      rate_limit: {
        Row: {
          count: number
          operation_type: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          operation_type: string
          user_id: string
          window_start: string
        }
        Update: {
          count?: number
          operation_type?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          operation_type: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          operation_type: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          operation_type?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          file_url: string | null
          id: string
          transaction_id: string | null
          upload_date: string | null
        }
        Insert: {
          file_url?: string | null
          id?: string
          transaction_id?: string | null
          upload_date?: string | null
        }
        Update: {
          file_url?: string | null
          id?: string
          transaction_id?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "view_expense_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "view_income_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_instalments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          method: string
          notes: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          method: string
          notes?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          method?: string
          notes?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          created_at: string | null
          id: string
          instalment_method:
            | Database["public"]["Enums"]["instalment_method"]
            | null
          other_credits: number | null
          personal_tax_credit_amount: number | null
          province: string | null
          safe_harbour_total_tax_last_year: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instalment_method?:
            | Database["public"]["Enums"]["instalment_method"]
            | null
          other_credits?: number | null
          personal_tax_credit_amount?: number | null
          province?: string | null
          safe_harbour_total_tax_last_year?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instalment_method?:
            | Database["public"]["Enums"]["instalment_method"]
            | null
          other_credits?: number | null
          personal_tax_credit_amount?: number | null
          province?: string | null
          safe_harbour_total_tax_last_year?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_categorization_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          match_text: string
          match_type: Database["public"]["Enums"]["match_type"]
          subcategory: string | null
          type: Database["public"]["Enums"]["categorization_type"]
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          match_text: string
          match_type: Database["public"]["Enums"]["match_type"]
          subcategory?: string | null
          type: Database["public"]["Enums"]["categorization_type"]
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          match_text?: string
          match_type?: Database["public"]["Enums"]["match_type"]
          subcategory?: string | null
          type?: Database["public"]["Enums"]["categorization_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categorization_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_name: string | null
          account_type: string
          amount: number | null
          category_override:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at: string | null
          date: string | null
          description: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          expense_category:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type: Database["public"]["Enums"]["expense_type"] | null
          id: string
          income_source:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name: string | null
          plaid_account_id: string | null
          plaid_category_raw: string[] | null
          plaid_pending: boolean | null
          plaid_raw: Json | null
          plaid_transaction_id: string | null
          receipt_path: string | null
          transaction_kind: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_type: string
          amount?: number | null
          category_override?:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory?:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string
          income_source?:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name?: string | null
          plaid_account_id?: string | null
          plaid_category_raw?: string[] | null
          plaid_pending?: boolean | null
          plaid_raw?: Json | null
          plaid_transaction_id?: string | null
          receipt_path?: string | null
          transaction_kind?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string
          amount?: number | null
          category_override?:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["transaction_direction"]
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory?:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string
          income_source?:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name?: string | null
          plaid_account_id?: string | null
          plaid_category_raw?: string[] | null
          plaid_pending?: boolean | null
          plaid_raw?: Json | null
          plaid_transaction_id?: string | null
          receipt_path?: string | null
          transaction_kind?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vehicle_logs: {
        Row: {
          created_at: string | null
          date: string
          distance_km: number
          from_location: string | null
          id: string
          purpose: string | null
          to_location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          distance_km: number
          from_location?: string | null
          id?: string
          purpose?: string | null
          to_location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          distance_km?: number
          from_location?: string | null
          id?: string
          purpose?: string | null
          to_location?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_expense_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          date: string | null
          description: string | null
          expense_category:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type: Database["public"]["Enums"]["expense_type"] | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory?:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          expense_subcategory?:
            | Database["public"]["Enums"]["expense_subcategory"]
            | null
          expense_type?: Database["public"]["Enums"]["expense_type"] | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      view_income_transactions: {
        Row: {
          account_name: string | null
          account_type: string | null
          amount: number | null
          category_override:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string | null
          income_source:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          amount?: number | null
          category_override?:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string | null
          income_source?:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          amount?: number | null
          category_override?:
            | Database["public"]["Enums"]["transaction_category"]
            | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string | null
          income_source?:
            | Database["public"]["Enums"]["income_source_type"]
            | null
          institution_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      floor_to_minute: {
        Args: { ts: string }
        Returns: string
      }
      rate_limit_check: {
        Args: { p_limit: number; p_op: string; p_user: string }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      refresh_daily_rollups: {
        Args: { p_from: string; p_to: string; p_user: string }
        Returns: undefined
      }
    }
    Enums: {
      audit_action_type:
        | "login_attempt"
        | "login_success"
        | "login_failure"
        | "logout"
        | "password_change"
        | "password_reset_request"
        | "rule_creation"
        | "rule_update"
        | "rule_deletion"
        | "file_upload"
        | "file_deletion"
        | "transaction_import"
        | "data_export"
        | "profile_update"
        | "settings_change"
        | "rate_limit_exceeded"
        | "suspicious_activity"
      categorization_type:
        | "business_income"
        | "business_expense"
        | "personal_expense"
      expense_category:
        | "CME"
        | "Fees & Insurance"
        | "Office Expenses or Supplies"
        | "Auto Expense"
        | "Shared Business"
        | "Personal"
        | "Parking"
      expense_subcategory:
        | "Books, Subscriptions, Journals"
        | "Professional Development/CME"
        | "Travel & Conference"
        | "Meals & Entertainment"
        | "CMPA Insurance"
        | "Insurance - Prof Overhead Expense"
        | "Professional Association Fees"
        | "Private Health Plan Premiums"
        | "Accounting & Legal"
        | "Bank Fees or Interest"
        | "Insurance - Home Office"
        | "Capital Assets (Computer, Desk etc)"
        | "Office Supplies"
        | "Salary to Secretary"
        | "Shared Overhead"
        | "Patient Medical/Drug Supplies"
        | "Gifts for Staff/Colleagues"
        | "Office - Telecom"
        | "Office - Internet"
        | "Meals & Entertainment (Office)"
        | "Insurance - Office"
        | "Gas"
        | "Repairs"
        | "Insurance (Auto)"
        | "Licensing Fees"
        | "Parking"
        | "Finance/Lease Payment"
        | "Rent/Mortgage"
        | "Hydro"
        | "Gas (Utilities)"
        | "Hot Water Heater"
        | "Property Tax"
        | "Water"
        | "Home Insurance"
        | "Cleaning Service"
        | "Other"
      expense_type: "business" | "personal" | "internal_transfer"
      income_source_type:
        | "OHIP"
        | "Fee for Service/Locum"
        | "Honoraria"
        | "AFP Funding"
        | "ER/On-Call Coverage"
        | "Recruiting Bonus"
        | "Stipend"
        | "CMPA Reimbursements"
        | "Other"
        | "uncategorized"
      instalment_method: "safe_harbour" | "estimate" | "not_required"
      match_type: "contains" | "equals"
      transaction_category:
        | "business_income"
        | "other_income"
        | "uncategorized"
        | "Internal Transfer"
      transaction_direction: "credit" | "debit"
      vehicle_deduction_method: "per_km" | "actual_expense"
      vehicle_tracking_mode: "trip" | "monthly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_action_type: [
        "login_attempt",
        "login_success",
        "login_failure",
        "logout",
        "password_change",
        "password_reset_request",
        "rule_creation",
        "rule_update",
        "rule_deletion",
        "file_upload",
        "file_deletion",
        "transaction_import",
        "data_export",
        "profile_update",
        "settings_change",
        "rate_limit_exceeded",
        "suspicious_activity",
      ],
      categorization_type: [
        "business_income",
        "business_expense",
        "personal_expense",
      ],
      expense_category: [
        "CME",
        "Fees & Insurance",
        "Office Expenses or Supplies",
        "Auto Expense",
        "Shared Business",
        "Personal",
        "Parking",
      ],
      expense_subcategory: [
        "Books, Subscriptions, Journals",
        "Professional Development/CME",
        "Travel & Conference",
        "Meals & Entertainment",
        "CMPA Insurance",
        "Insurance - Prof Overhead Expense",
        "Professional Association Fees",
        "Private Health Plan Premiums",
        "Accounting & Legal",
        "Bank Fees or Interest",
        "Insurance - Home Office",
        "Capital Assets (Computer, Desk etc)",
        "Office Supplies",
        "Salary to Secretary",
        "Shared Overhead",
        "Patient Medical/Drug Supplies",
        "Gifts for Staff/Colleagues",
        "Office - Telecom",
        "Office - Internet",
        "Meals & Entertainment (Office)",
        "Insurance - Office",
        "Gas",
        "Repairs",
        "Insurance (Auto)",
        "Licensing Fees",
        "Parking",
        "Finance/Lease Payment",
        "Rent/Mortgage",
        "Hydro",
        "Gas (Utilities)",
        "Hot Water Heater",
        "Property Tax",
        "Water",
        "Home Insurance",
        "Cleaning Service",
        "Other",
      ],
      expense_type: ["business", "personal", "internal_transfer"],
      income_source_type: [
        "OHIP",
        "Fee for Service/Locum",
        "Honoraria",
        "AFP Funding",
        "ER/On-Call Coverage",
        "Recruiting Bonus",
        "Stipend",
        "CMPA Reimbursements",
        "Other",
        "uncategorized",
      ],
      instalment_method: ["safe_harbour", "estimate", "not_required"],
      match_type: ["contains", "equals"],
      transaction_category: [
        "business_income",
        "other_income",
        "uncategorized",
        "Internal Transfer",
      ],
      transaction_direction: ["credit", "debit"],
      vehicle_deduction_method: ["per_km", "actual_expense"],
      vehicle_tracking_mode: ["trip", "monthly"],
    },
  },
} as const
