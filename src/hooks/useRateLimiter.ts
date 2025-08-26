/*
 * SECURITY NOTE: Rate Limiting Implementation
 * 
 * This hook provides client-side interface to the centralized rate limiting system.
 * 
 * Architecture:
 * 1. Client calls checkRateLimit() before performing sensitive operations
 * 2. Request sent to rate-limiter edge function with user's auth token
 * 3. Edge function validates token and checks database for rate limit status
 * 4. Database tracks requests per user per operation type in sliding windows
 * 5. Response indicates whether request should proceed
 * 
 * Security Features:
 * - User-scoped: Each user has independent rate limits
 * - Token-based: Requires valid authentication
 * - Sliding window: More accurate than fixed time periods
 * - Fail-open: If rate limiter is unavailable, requests are allowed (availability over strict limits)
 * - Operation-specific: Different limits for different types of actions
 * 
 * Rate Limits (per minute):
 * - Rule creation: 10/min
 * - File uploads: 20/min  
 * - Transaction imports: 5/min
 * - General operations: 60/min
 * 
 * Usage Pattern:
 * ```typescript
 * const allowed = await checkRateLimit('operation_type');
 * if (!allowed) return; // User already notified via toast
 * // Proceed with operation...
 * ```
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

interface RateLimitError {
  error: string;
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export const useRateLimiter = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkRateLimit = useCallback(async (operation: string): Promise<boolean> => {
    setIsChecking(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('rate-limiter', {
        body: { operation }
      });

      if (error) {
        console.error('Rate limiter error:', error);
        
        // If rate limiter is down, fail open (allow request)
        toast({
          title: "Rate Limiting Unavailable",
          description: "Proceeding with request. Rate limiting temporarily disabled.",
          variant: "default"
        });
        return true;
      }

      const rateLimitResult: RateLimitResult | RateLimitError = result;

      if (!rateLimitResult.allowed) {
        const resetDate = new Date(rateLimitResult.resetTime);
        const resetMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (1000 * 60));
        
        toast({
          title: "Rate Limit Exceeded",
          description: rateLimitResult.message || 
            `Too many requests. Please wait ${resetMinutes} minute(s) before trying again.`,
          variant: "destructive"
        });
        
        return false;
      }

      // Show warning when approaching limit
      if (rateLimitResult.remaining <= 2 && rateLimitResult.remaining > 0) {
        toast({
          title: "Approaching Rate Limit",
          description: `Only ${rateLimitResult.remaining} requests remaining this minute.`,
          variant: "default"
        });
      }

      return true;

    } catch (error) {
      console.error('Rate limiter request failed:', error);
      
      // Fail open - allow request if rate limiter is completely unavailable
      toast({
        title: "Rate Limiting Error",
        description: "Proceeding with request. Please contact support if this persists.",
        variant: "default"
      });
      return true;
      
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  return {
    checkRateLimit,
    isChecking
  };
};

// Helper function to wrap operations with rate limiting
export const withRateLimit = async (
  operation: string, 
  checkRateLimit: (op: string) => Promise<boolean>,
  callback: () => Promise<void> | void
): Promise<boolean> => {
  const allowed = await checkRateLimit(operation);
  
  if (allowed) {
    await callback();
    return true;
  }
  
  return false;
};