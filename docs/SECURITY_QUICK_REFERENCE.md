# Security Quick Reference for Developers

## 🚨 Security Checklist for New Features

When adding new functionality, ensure you've covered these security aspects:

### Database Tables
- [ ] **Enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- [ ] **Add user-scoped policies**: `USING (auth.uid() = user_id)`
- [ ] **Separate policies for each operation**: SELECT, INSERT, UPDATE, DELETE
- [ ] **Test policies**: Verify users can't access other users' data

### API Operations  
- [ ] **Add rate limiting**: Use `checkRateLimit('operation_name')`
- [ ] **Add audit logging**: Use `logSuccess()` and `logFailure()`
- [ ] **Validate inputs**: Sanitize and validate all user inputs
- [ ] **Check authentication**: Verify user is logged in

### File Operations
- [ ] **Validate file types**: Check MIME type and extension
- [ ] **Limit file sizes**: Enforce reasonable size limits
- [ ] **Sanitize filenames**: Remove dangerous characters
- [ ] **User-scoped paths**: Store files in user-specific folders

## 🔑 Common Security Patterns

### User Data Access Pattern
```sql
-- Standard RLS policy for user-owned data
CREATE POLICY "Users can access their own data" 
ON table_name 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Rate Limited Operation Pattern
```typescript
const { checkRateLimit } = useRateLimiter();
const { logSuccess, logFailure } = useAuditLogger();

const performOperation = async () => {
  // 1. Check rate limiting
  const allowed = await checkRateLimit('operation_type');
  if (!allowed) return;
  
  try {
    // 2. Perform operation
    const result = await supabase.from('table').insert(data);
    
    // 3. Log success
    await logSuccess('operation_type', { details });
    
    return result;
  } catch (error) {
    // 4. Log failure
    await logFailure('operation_type', error.message);
    throw error;
  }
};
```

### Input Validation Pattern
```typescript
const validateAndSanitize = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML
    .substring(0, 255);   // Limit length
};
```

## 🚫 Security Anti-Patterns (What NOT to Do)

### ❌ Never Do These:
```typescript
// DON'T: Raw SQL queries in edge functions
await supabase.query('SELECT * FROM users'); 

// DON'T: Bypass RLS with service role in frontend
const adminClient = createClient(url, serviceRoleKey);

// DON'T: Store sensitive data in localStorage
localStorage.setItem('password', userPassword);

// DON'T: Trust client-side validation only
if (clientSideValid) { /* proceed */ } // Add server validation too!

// DON'T: Use user input directly in database queries
const query = `SELECT * FROM table WHERE id = ${userInput}`; // SQL injection risk
```

### ✅ Do This Instead:
```typescript
// DO: Use Supabase client methods
await supabase.from('users').select('*');

// DO: Use anon key with RLS
const client = createClient(url, anonKey);

// DO: Let Supabase handle token storage
// (Automatic with auth.signIn)

// DO: Validate on both client and server
const isValid = validateInput(input); // Client-side
// + RLS policies and edge function validation (Server-side)

// DO: Use parameterized queries via Supabase client
await supabase.from('table').select('*').eq('id', userInput);
```

## 🔍 Security Testing Commands

### Test RLS Policies
```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"user-id-here"}';
SELECT * FROM your_table; -- Should only return user's data

-- Test as anonymous user  
SET LOCAL ROLE anon;
SELECT * FROM your_table; -- Should return nothing or error
```

### Test Rate Limiting
```typescript
// Rapidly call rate-limited operation to test limits
for (let i = 0; i < 15; i++) {
  await createRule(testData);
}
// Should start rejecting after 10 attempts
```

## 📊 Security Monitoring

### Key Metrics to Watch
- **Failed login attempts**: > 5 per user per hour
- **Rate limit violations**: Frequent for same user
- **Suspicious activity flags**: Auto-detected patterns
- **File upload sizes**: Unusually large files
- **API error rates**: High 401/403 responses

### Log Locations
- **Supabase Auth logs**: Authentication events
- **Edge function logs**: Rate limiting, audit logging
- **Application audit logs**: User actions and security events
- **Database logs**: Query performance and errors

## 🆘 Security Incident Response

### If You Suspect a Security Issue:

1. **Immediate Actions**:
   - Don't panic or make hasty changes
   - Document what you observed
   - Check recent audit logs
   - Verify RLS policies are active

2. **Investigation**:
   - Check edge function logs for unusual patterns
   - Review recent user activities in audit logs
   - Verify rate limiting is working
   - Check for unusual database access patterns

3. **Mitigation**:
   - Temporarily disable affected features if needed
   - Increase rate limiting if under attack
   - Review and strengthen RLS policies
   - Update security documentation

4. **Recovery**:
   - Apply security fixes
   - Test thoroughly
   - Monitor for continued issues
   - Update security procedures

## 📚 Additional Resources

- [Main Security Documentation](./SECURITY.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Function Security](https://supabase.com/docs/guides/functions/auth)
- [Database Security Best Practices](https://supabase.com/docs/guides/database/overview)

---

*Remember: Security is everyone's responsibility. When in doubt, ask for a security review!*