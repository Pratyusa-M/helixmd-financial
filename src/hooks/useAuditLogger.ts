/*
 * SECURITY NOTE: Audit Logging System
 * 
 * This hook provides secure audit logging for all sensitive user actions.
 * 
 * Security Architecture:
 * 1. Client calls logging functions for user actions
 * 2. Requests sent to audit-logger edge function with user's auth token
 * 3. Edge function validates authentication and extracts user context
 * 4. Logs stored in database with RLS policies (users can read, only service role can write)
 * 5. Background suspicious activity detection runs automatically
 * 
 * What Gets Logged:
 * - Authentication events (login, logout, failures)
 * - Data modifications (rules, files, profile updates)  
 * - Security events (rate limiting, suspicious activity)
 * - User context (IP address, user agent, timestamps)
 * 
 * Security Features:
 * - Immutable logs: Users cannot modify their audit logs
 * - Service role writes: Only backend can insert logs (prevents tampering)
 * - Comprehensive coverage: All sensitive operations logged
 * - Automatic cleanup: Logs older than 2 years removed
 * - Suspicious activity detection: Automatic pattern recognition
 * - Fail-safe design: Audit failures don't break user experience
 * 
 * Privacy Considerations:
 * - No sensitive data stored (passwords, tokens, etc.)
 * - User-scoped access (users only see their own logs)
 * - IP addresses logged for security but can be anonymized if needed
 * - Retention period limits data exposure
 * 
 * Usage Pattern:
 * ```typescript
 * const { logSuccess, logFailure } = useAuditLogger();
 * 
 * try {
 *   await performAction();
 *   await logSuccess('action_type', { details });
 * } catch (error) {
 *   await logFailure('action_type', error.message, { details });
 * }
 * ```
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AuditActionType = 
  | 'login_attempt' | 'login_success' | 'login_failure' | 'logout'
  | 'password_change' | 'password_reset_request' | 'rule_creation'
  | 'rule_update' | 'rule_deletion' | 'file_upload' | 'file_deletion'
  | 'transaction_import' | 'data_export' | 'profile_update'
  | 'settings_change' | 'rate_limit_exceeded' | 'suspicious_activity';

interface AuditLogEntry {
  action_type: AuditActionType;
  action_details?: Record<string, any>;
  success?: boolean;
  error_message?: string;
  session_id?: string;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAuditEvent = useCallback(async (
    action_type: AuditActionType,
    options: Omit<AuditLogEntry, 'action_type'> = {}
  ): Promise<void> => {
    try {
      // Don't log if user is not authenticated (except for login attempts)
      if (!user && !['login_attempt', 'login_success', 'login_failure'].includes(action_type)) {
        return;
      }

      const entry: AuditLogEntry = {
        action_type,
        action_details: options.action_details || {},
        success: options.success !== false, // Default to true
        error_message: options.error_message,
        session_id: options.session_id
      };

      const { error } = await supabase.functions.invoke('audit-logger', {
        body: { entries: [entry] }
      });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw error - audit logging shouldn't break the main flow
      }

    } catch (error) {
      console.error('Audit logging error:', error);
      // Fail silently - audit logging is important but shouldn't break user experience
    }
  }, [user]);

  const logBatch = useCallback(async (entries: AuditLogEntry[]): Promise<void> => {
    try {
      if (!user) return;

      const { error } = await supabase.functions.invoke('audit-logger', {
        body: { entries }
      });

      if (error) {
        console.error('Failed to log audit batch:', error);
      }

    } catch (error) {
      console.error('Batch audit logging error:', error);
    }
  }, [user]);

  // Convenience methods for common actions
  const logSuccess = useCallback((action_type: AuditActionType, details?: Record<string, any>) => {
    return logAuditEvent(action_type, { action_details: details, success: true });
  }, [logAuditEvent]);

  const logFailure = useCallback((action_type: AuditActionType, error: string, details?: Record<string, any>) => {
    return logAuditEvent(action_type, { 
      action_details: details, 
      success: false, 
      error_message: error 
    });
  }, [logAuditEvent]);

  const logRuleCreation = useCallback((ruleData: Record<string, any>) => {
    return logSuccess('rule_creation', {
      rule_type: ruleData.type,
      match_type: ruleData.match_type,
      category: ruleData.category,
      subcategory: ruleData.subcategory
    });
  }, [logSuccess]);

  const logFileUpload = useCallback((fileName: string, fileType: string, fileSize: number, transactionId?: string) => {
    return logSuccess('file_upload', {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      transaction_id: transactionId
    });
  }, [logSuccess]);

  const logDataExport = useCallback((exportType: string, recordCount?: number) => {
    return logSuccess('data_export', {
      export_type: exportType,
      record_count: recordCount,
      timestamp: new Date().toISOString()
    });
  }, [logSuccess]);

  const logProfileUpdate = useCallback((updatedFields: string[]) => {
    return logSuccess('profile_update', {
      updated_fields: updatedFields,
      timestamp: new Date().toISOString()
    });
  }, [logSuccess]);

  const logRateLimitExceeded = useCallback((operation: string, limit: number) => {
    return logAuditEvent('rate_limit_exceeded', {
      action_details: { operation, limit },
      success: false
    });
  }, [logAuditEvent]);

  return {
    logAuditEvent,
    logBatch,
    logSuccess,
    logFailure,
    logRuleCreation,
    logFileUpload,
    logDataExport,
    logProfileUpdate,
    logRateLimitExceeded
  };
};

// Hook to fetch user's audit logs (for admin/security view)
export const useAuditLogs = (limit = 50) => {
  const { user } = useAuth();

  const fetchAuditLogs = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action_type,
          action_details,
          ip_address,
          success,
          error_message,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }, [user, limit]);

  return { fetchAuditLogs };
};