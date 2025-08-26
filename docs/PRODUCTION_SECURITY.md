# Production Security Configuration

This document outlines the security configurations required for deploying the application to production.

## 🔐 Security Headers Configuration

### Required Security Headers

When deploying to production, ensure your web server (Nginx, Apache, CloudFlare, etc.) includes these security headers:

```nginx
# Content Security Policy - Prevents XSS attacks
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kfvmkdxnevfognngesrf.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://kfvmkdxnevfognngesrf.supabase.co wss://kfvmkdxnevfognngesrf.supabase.co; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';";

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff";

# Prevent clickjacking attacks
add_header X-Frame-Options "DENY";

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block";

# Control referrer information
add_header Referrer-Policy "strict-origin-when-cross-origin";

# Restrict browser features
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

# Force HTTPS (if using HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
```

### CloudFlare Configuration

If using CloudFlare, configure these security settings:

1. **Security > WAF**
   - Enable managed rules
   - Set to "High" security level

2. **Security > DDoS**
   - Enable DDoS protection

3. **SSL/TLS**
   - Set to "Full (strict)"
   - Enable "Always Use HTTPS"

### Vercel Configuration

For Vercel deployments, add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://kfvmkdxnevfognngesrf.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://kfvmkdxnevfognngesrf.supabase.co wss://kfvmkdxnevfognngesrf.supabase.co; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

## 🛡️ Supabase Production Security

### Authentication Settings

Configure these settings in the Supabase dashboard:

1. **Password Requirements**
   - Minimum length: 8 characters
   - Require uppercase, lowercase, numbers
   - Enable leaked password protection

2. **OTP Settings**
   - Reduce OTP expiry to 5 minutes (300 seconds)
   - Enable rate limiting for OTP requests

3. **Session Management**
   - Set appropriate session timeout
   - Enable refresh token rotation

### Rate Limiting

The application includes built-in rate limiting. For production:

1. Monitor rate limit violations in audit logs
2. Adjust limits based on usage patterns
3. Set up alerts for excessive rate limit violations

### Database Security

1. **Regular Backups**
   - Enable automated daily backups
   - Test backup restoration procedures

2. **Monitoring**
   - Enable slow query monitoring
   - Set up alerts for unusual database activity

3. **Access Control**
   - Regularly audit database permissions
   - Monitor for privilege escalation attempts

## 🔍 Security Monitoring

### Audit Log Monitoring

Monitor these patterns in audit logs:

```sql
-- Failed login attempts
SELECT * FROM audit_logs 
WHERE action_type = 'auth_failure' 
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Suspicious activity patterns
SELECT * FROM audit_logs 
WHERE action_type = 'suspicious_activity'
ORDER BY created_at DESC;

-- Rate limit violations
SELECT * FROM audit_logs 
WHERE action_type = 'rate_limit_exceeded'
AND created_at > NOW() - INTERVAL '1 day';
```

### Performance Monitoring

1. **Application Performance**
   - Monitor page load times
   - Track API response times
   - Set up error tracking (Sentry, etc.)

2. **Database Performance**
   - Monitor query performance
   - Track connection pool usage
   - Set up alerts for slow queries

## 📋 Deployment Checklist

### Pre-deployment Security Checks

- [ ] All security headers configured
- [ ] CSP policy tested and working
- [ ] HTTPS certificate installed and working
- [ ] Database migrations applied
- [ ] Environment variables secured
- [ ] API keys rotated if necessary
- [ ] Security linter passed
- [ ] Backup procedures tested

### Post-deployment Verification

- [ ] Security headers present in response
- [ ] CSP policy not blocking functionality
- [ ] Authentication flows working
- [ ] Rate limiting functioning
- [ ] Audit logging active
- [ ] Database connections secure
- [ ] File upload restrictions working

### Ongoing Maintenance

- [ ] Weekly security log review
- [ ] Monthly dependency updates
- [ ] Quarterly security assessment
- [ ] Annual penetration testing

## 🚨 Incident Response

### Security Incident Response Plan

1. **Detection**
   - Monitor audit logs for suspicious patterns
   - Set up automated alerts
   - Regular security assessments

2. **Response**
   - Immediate: Isolate affected systems
   - Short-term: Investigate and contain
   - Long-term: Remediate and prevent

3. **Recovery**
   - Restore from backups if necessary
   - Apply security patches
   - Update monitoring and detection

### Contact Information

Maintain up-to-date contact information for:
- Security team
- Database administrators
- Hosting provider support
- Legal/compliance team

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)