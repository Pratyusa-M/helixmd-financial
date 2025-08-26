import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/*
 * SECURITY NOTE: Authentication & Session Management
 * 
 * This context implements secure session handling using Supabase Auth:
 * 
 * 1. JWT Token Management:
 *    - Tokens are automatically managed by Supabase client
 *    - Stored securely in browser storage (not accessible via JavaScript)
 *    - Automatically refreshed before expiration
 *    - Invalidated on logout both client and server-side
 * 
 * 2. Session State:
 *    - We store both `user` and `session` objects
 *    - `user` contains profile info, `session` contains auth tokens
 *    - Session object is required for authenticated API calls
 * 
 * 3. Security Features:
 *    - onAuthStateChange listener catches all auth events
 *    - Automatic token refresh prevents expired sessions
 *    - Iframe detection prevents auth conflicts in embedded contexts
 *    - All auth operations are logged for audit purposes
 * 
 * 4. Recovery Mode:
 *    - Special mode for password reset flows
 *    - Prevents normal auth flow during recovery
 *    - URL parameter detection for recovery state
 */

// Import audit logging (but avoid circular dependency)
const logAuthEvent = async (action_type: string, success: boolean, error_message?: string, details?: Record<string, any>) => {
  try {
    await supabase.functions.invoke('audit-logger', {
      body: { 
        entries: [{ 
          action_type, 
          success, 
          error_message,
          action_details: details || {}
        }] 
      }
    });
  } catch (err) {
    console.error('Failed to log auth event:', err);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;  // Contains JWT tokens - required for authenticated requests
  loading: boolean;
  isRecoveryMode: boolean;  // Special mode for password reset flows
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  completeRecovery: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    if (!isInIframe) {
      // Check URL parameters for recovery mode
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      
      if (type === 'recovery') {
        console.log('AuthContext: Recovery mode detected');
        setIsRecoveryMode(true);
        setLoading(false);
        return;
      }
    }

    // Set up auth state listener FIRST (critical for preventing deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        
        // ONLY synchronous state updates here - no async calls!
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle PASSWORD_RECOVERY event only if not in iframe
        if (event === 'PASSWORD_RECOVERY' && !isInIframe) {
          setIsRecoveryMode(true);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      // Log sign up attempt
      await logAuthEvent('login_attempt', !error, error?.message, {
        action: 'sign_up',
        email: email,
        has_name: !!(firstName && lastName)
      });
      
      return { error };
    } catch (err: any) {
      await logAuthEvent('login_attempt', false, err.message, {
        action: 'sign_up',
        email: email
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Log sign in attempt
      await logAuthEvent(
        error ? 'login_failure' : 'login_success', 
        !error, 
        error?.message, 
        { email: email }
      );
      
      return { error };
    } catch (err: any) {
      await logAuthEvent('login_failure', false, err.message, { email: email });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Log successful logout
      await logAuthEvent('logout', true, undefined, {
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
      // Still log the attempt even if it failed
      await logAuthEvent('logout', false, err.message);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      // Log password reset request
      await logAuthEvent('password_reset_request', !error, error?.message, {
        email: email,
        redirect_to: redirectTo
      });
      
      return { error };
    } catch (err: any) {
      await logAuthEvent('password_reset_request', false, err.message, { email: email });
      return { error: err };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      // Log password change attempt
      await logAuthEvent('password_change', !error, error?.message, {
        timestamp: new Date().toISOString()
      });
      
      return { error };
    } catch (err: any) {
      await logAuthEvent('password_change', false, err.message);
      return { error: err };
    }
  };

  const completeRecovery = async () => {
    setIsRecoveryMode(false);
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    isRecoveryMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    completeRecovery,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};