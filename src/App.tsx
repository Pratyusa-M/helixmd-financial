
/*
 * SECURITY ARCHITECTURE OVERVIEW
 * 
 * This application implements a multi-layered security model:
 * 
 * 1. CLIENT-SIDE SECURITY:
 *    - Authentication via Supabase Auth (JWT tokens)
 *    - Input validation and sanitization
 *    - Rate limiting before sensitive operations
 *    - CSP headers prevent XSS attacks
 *    - Audit logging for accountability
 * 
 * 2. DATABASE SECURITY:
 *    - Row Level Security (RLS) policies on all tables
 *    - User-scoped data access (auth.uid() = user_id)
 *    - Service role separation for admin operations
 *    - Automatic backup and encryption
 * 
 * 3. API SECURITY:
 *    - Edge functions with authentication validation
 *    - Rate limiting per user per operation
 *    - Comprehensive audit logging
 *    - CORS protection and input validation
 * 
 * 4. FILE SECURITY:
 *    - Type and size validation
 *    - User-scoped storage paths
 *    - Filename sanitization
 *    - Storage policies via RLS
 * 
 * The security boundary is primarily at the database level (RLS policies).
 * Even if frontend code is compromised, users cannot access other users' data.
 * 
 * For detailed security information, see:
 * - docs/SECURITY.md (comprehensive guide)
 * - docs/SECURITY_QUICK_REFERENCE.md (developer checklist)
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarToggleFab } from "@/components/SidebarToggleFab";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FiscalYearProvider } from "@/contexts/FiscalYearContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Vehicle from "./pages/Vehicle";
import TaxEstimator from "./pages/TaxEstimator";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Retry failed requests only once
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { user, loading, isRecoveryMode } = useAuth();
  
  console.log('AppContent render:', { user: !!user, loading, isRecoveryMode });
  
  if (loading) {
    console.log('AppContent: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we're in recovery mode, show the auth page regardless of login status
  if (isRecoveryMode) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <Auth />} 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <main className="flex-1 p-6 bg-gray-50">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/vehicle" element={<Vehicle />} />
                    <Route path="/tax-estimator" element={<TaxEstimator />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <SidebarToggleFab />
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <FiscalYearProvider>
                <AppContent />
              </FiscalYearProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
