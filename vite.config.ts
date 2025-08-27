/*
 * SECURITY NOTE: Vite Configuration with Security Headers
 * 
 * This configuration implements multiple security layers:
 * 
 * 1. Content Security Policy (CSP):
 *    - Restricts script sources to prevent XSS attacks
 *    - Allows inline scripts/styles (required for React/Tailwind)
 *    - Restricts network connections to trusted domains only
 *    - Blocks iframes and plugins to prevent clickjacking
 * 
 * 2. Additional Security Headers:
 *    - X-Content-Type-Options: Prevents MIME-type sniffing
 *    - X-Frame-Options: Blocks iframe embedding
 *    - X-XSS-Protection: Enables browser XSS protection
 *    - Referrer-Policy: Controls referrer information leakage
 *    - Permissions-Policy: Disables sensitive browser APIs
 * 
 * 3. Build Security:
 *    - Source maps only in development (prevents code exposure)
 *    - Production builds strip development artifacts
 * 
 * Note: These headers apply to development server only.
 * Production deployment should implement similar headers at the web server level.
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8080,
      headers: {
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        // Allow iframe embedding in development for Lovable preview
        ...(mode === 'development' ? {} : { 'X-Frame-Options': 'DENY' }),
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        
        // Content Security Policy for XSS protection
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wllrommtrmlwlciaenzf.supabase.co https://cdn.plaid.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https: http:",
          "connect-src 'self' https://wllrommtrmlwlciaenzf.supabase.co wss://wllrommtrmlwlciaenzf.supabase.co https://api.supabase.co https://*.plaid.com https://wllrommtrmlwlciaenzf.supabase.co/functions/v1",
          // Allow iframe embedding in development for Lovable preview
          mode === 'development' ? "frame-src *" : "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests"
        ].join('; '),
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Security: Don't expose source maps in production
          sourcemap: mode === 'development',
        },
      },
    },
    define: {
      // Expose environment variables to TypeScript
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    },
  };
});