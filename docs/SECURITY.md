# Security Architecture Documentation

## Overview

This application implements a comprehensive security model using Supabase as the backend service. This document explains the security patterns, design decisions, and implementation details for future developers.

## Table of Contents

1. [Authentication & Session Management](#authentication--session-management)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [Public API Keys Safety](#public-api-keys-safety)
4. [Rate Limiting](#rate-limiting)
5. [Audit Logging](#audit-logging)
6. [File Upload Security](#file-upload-security)
7. [XSS Protection](#xss-protection)
8. [Database Security](#database-security)
9. [Edge Function Security](#edge-function-security)

---

## Authentication & Session Management

### Design Philosophy
- **JWT-based authentication** with automatic token refresh
- **Session persistence** across browser restarts
- **Secure token storage** using Supabase's built-in mechanisms
- **Fail-safe authentication** checks throughout the application

### Implementation Details

#### Session State Management
```typescript
// In AuthContext.tsx
const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);
```

**Why we store both user and session:**
- `user` object contains profile information
- `session` object contains authentication tokens and expiry
- Session tokens are required for API calls and automatic refresh

#### Authentication Flow
1. **Login**: User provides credentials → Supabase validates → JWT token issued
2. **Token Storage**: Automatically stored in browser's secure storage
3. **Auto-refresh**: Tokens refreshed before expiry (handled by Supabase client)
4. **Logout**: Tokens invalidated both client and server-side

#### Security Considerations
- **No manual token handling**: Supabase client manages all token operations
- **Automatic HTTPS**: All auth requests use HTTPS in production
- **Token validation**: Server validates tokens on every API request
- **Iframe protection**: Special handling prevents auth issues in iframes

---

## Row Level Security (RLS)

### Design Philosophy
RLS provides **database-level security** that cannot be bypassed, even with direct database access or compromised application code.

### Policy Patterns

#### 1. User-Scoped Data
```sql
-- Pattern: Users can only access their own records
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
```

**Why this pattern:**
- Prevents data leakage between users
- Works even if application code is compromised
- Database enforces isolation automatically

#### 2. Read-Only Reference Data
```sql
-- Pattern: Authenticated users can read shared reference data
CREATE POLICY "All authenticated users can view category mappings" 
ON public.category_subcategory_mapping 
FOR SELECT 
TO authenticated
USING (true);
```

**Use case:** Static data that all users need access to (categories, mappings)

#### 3. Service Role Operations
```sql
-- Pattern: Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);
```

**Security benefit:** Prevents users from tampering with audit logs

### RLS Best Practices Implemented

1. **Always enable RLS** on user data tables
2. **Use `auth.uid()`** for user identification (secure and reliable)
3. **Separate policies** for different operations (SELECT, INSERT, UPDATE, DELETE)
4. **Test policies thoroughly** - RLS can be complex
5. **Use `service_role`** sparingly and only when necessary

---

## Public API Keys Safety

### Why Public Keys Are Safe

**Supabase Anon Key (`SUPABASE_ANON_KEY`):**
- ✅ **Designed to be public** - can be safely included in frontend code
- ✅ **Limited permissions** - only allows operations permitted by RLS policies
- ✅ **User context aware** - becomes authenticated when user logs in
- ✅ **Database protected** - RLS prevents unauthorized data access

### What Makes It Secure

1. **Row Level Security**: Database policies restrict access regardless of API key
2. **Authentication Required**: Most operations require valid user session
3. **No Admin Privileges**: Anon key cannot perform admin operations
4. **Rate Limiting**: Edge functions implement additional rate limiting

### Keys That Must Stay Secret

**Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`):**
- ❌ **Never expose** to frontend
- ❌ **Bypasses RLS** - has full database access
- ✅ **Edge functions only** - used in server-side functions
- ✅ **Environment variables** - stored securely in Supabase

---

## Rate Limiting

### Architecture
```
User Request → Rate Limiter Edge Function → Database Check → Allow/Deny
```

### Implementation Details

#### Rate Limit Storage
```sql
-- Sliding window approach using database table
CREATE TABLE public.rate_limits (
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  request_count integer NOT NULL,
  window_start timestamp with time zone NOT NULL
);
```

#### Security Features
- **User-scoped**: Each user has independent limits
- **Operation-specific**: Different limits for different actions
- **Sliding window**: More accurate than fixed windows
- **Fail-open**: If rate limiter fails, requests are allowed (availability over strict enforcement)

#### Rate Limits Configuration
```typescript
const RATE_LIMITS = {
  'rule_creation': 10,      // 10 rules per minute
  'file_upload': 20,        // 20 file uploads per minute
  'transaction_import': 5,   // 5 bulk imports per minute
  'default': 60             // 60 general requests per minute
}
```

---

## Audit Logging

### Security Design
- **Immutable logs**: Users cannot modify their audit logs
- **Service role only**: Only backend can write logs
- **Comprehensive coverage**: All sensitive operations logged
- **Automatic cleanup**: Logs older than 2 years removed

### What Gets Logged
- Authentication events (login, logout, failures)
- Data modifications (rules, files, profile updates)
- Security events (rate limiting, suspicious activity)
- User context (IP, user agent, timestamps)

### Suspicious Activity Detection
```typescript
// Automatic detection patterns:
- failedAttempts >= 10        // Too many failures
- recentLogs.length >= 100    // Excessive activity
- bruteForcePattern          // Failures followed by success
```

---

## File Upload Security

### Security Layers

#### 1. File Type Validation
```typescript
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
```

#### 2. File Size Limits
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
```

#### 3. Filename Sanitization
```typescript
// Remove dangerous characters and limit length
const sanitizedBaseName = baseFileName
  .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace unsafe chars
  .replace(/_{2,}/g, '_')             // Collapse underscores
  .substring(0, 100);                 // Limit length
```

#### 4. Path Security
```typescript
// User-scoped storage paths prevent access to other users' files
const fileName = `${user.id}/${transactionId}/${Date.now()}_${finalFileName}.${fileExt}`;
```

#### 5. Storage Policies
```sql
-- Users can only access files in their own folder
CREATE POLICY "Users can view their own receipts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

---

## XSS Protection

### Content Security Policy (CSP)
```typescript
// Strict CSP headers prevent script injection
'Content-Security-Policy': [
  "default-src 'self'",                    // Only same-origin by default
  "script-src 'self' 'unsafe-inline'",    // Scripts from self + inline (needed for React)
  "style-src 'self' 'unsafe-inline'",     // Styles from self + inline (needed for Tailwind)
  "connect-src 'self' https://supabase.co", // API connections to Supabase only
  "frame-src 'none'",                     // No iframes allowed
  "object-src 'none'"                     // No plugins
].join('; ')
```

### Input Sanitization
```typescript
// All user inputs are sanitized before database storage
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .substring(0, 255);   // Limit length
};
```

### Safe Chart Rendering
- **Removed `dangerouslySetInnerHTML`** from chart components
- **Input validation** for color values and CSS properties
- **React's built-in escaping** for all dynamic content

---

## Database Security

### Connection Security
- **TLS encryption**: All database connections use TLS
- **Connection pooling**: Managed by Supabase
- **No direct database access**: Application uses Supabase client only

### SQL Injection Prevention
- **Parameterized queries**: Supabase client prevents SQL injection
- **No raw SQL**: Edge functions use client methods, not raw queries
- **Type safety**: TypeScript provides compile-time checks

### Backup and Recovery
- **Automatic backups**: Managed by Supabase
- **Point-in-time recovery**: Available for premium plans
- **Data encryption**: At rest and in transit

---

## Edge Function Security

### Authentication
```typescript
// All edge functions verify user authentication
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return new Response('Unauthorized', { status: 401 })
}
```

### CORS Configuration
```typescript
// Secure CORS headers for web app integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Input Validation
```typescript
// All inputs validated before processing
function sanitizeAuditEntry(entry: AuditLogEntry): AuditLogEntry {
  if (!validActionTypes.includes(entry.action_type)) {
    throw new Error(`Invalid action type: ${entry.action_type}`)
  }
  // ... additional validation
}
```

### Error Handling
```typescript
// Secure error handling - no sensitive data in responses
catch (error) {
  console.error('Internal error:', error) // Log full error server-side
  return new Response(
    JSON.stringify({ error: 'Internal server error' }), // Generic client response
    { status: 500 }
  )
}
```

---

## Security Monitoring

### What to Monitor
1. **Failed authentication attempts** - Multiple failures may indicate brute force
2. **Rate limit violations** - May indicate automated attacks
3. **Suspicious activity patterns** - Detected automatically by audit system
4. **Large file uploads** - Monitor for abuse
5. **Unusual API usage** - Check edge function logs

### Security Logs Locations
- **Authentication events**: Supabase Auth logs
- **Application events**: Audit logs table
- **Edge function events**: Supabase Function logs
- **Database events**: Postgres logs

---

## Development Guidelines

### When Adding New Features

1. **Always implement RLS** for new tables
2. **Add rate limiting** for sensitive operations
3. **Include audit logging** for user actions
4. **Validate all inputs** server-side
5. **Test security policies** thoroughly
6. **Update this documentation** with changes

### Security Testing Checklist

- [ ] Can users access other users' data?
- [ ] Are rate limits working correctly?
- [ ] Are audit logs being generated?
- [ ] Do RLS policies prevent data leakage?
- [ ] Are file uploads properly validated?
- [ ] Is authentication required where needed?

### Code Review Security Focus

- Check for direct database queries (should use Supabase client)
- Verify RLS policies on new tables
- Ensure user inputs are validated/sanitized
- Confirm sensitive operations are rate limited
- Validate audit logging implementation

---

This security model provides defense in depth with multiple layers of protection. Each layer serves as a backup for the others, ensuring the application remains secure even if one layer is compromised.