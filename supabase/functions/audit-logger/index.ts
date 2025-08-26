import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
}

interface AuditLogEntry {
  action_type: string
  action_details?: Record<string, any>
  success?: boolean
  error_message?: string
  session_id?: string
}

interface AuditLogRequest {
  entries: AuditLogEntry[]
}

// Extract IP address from request headers
function extractClientIP(req: Request): string | null {
  const xForwardedFor = req.headers.get('x-forwarded-for')
  const xRealIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return null
}

// Sanitize and validate audit log entry
function sanitizeAuditEntry(entry: AuditLogEntry): AuditLogEntry {
  const validActionTypes = [
    'login_attempt', 'login_success', 'login_failure', 'logout',
    'password_change', 'password_reset_request', 'rule_creation',
    'rule_update', 'rule_deletion', 'file_upload', 'file_deletion',
    'transaction_import', 'data_export', 'profile_update',
    'settings_change', 'rate_limit_exceeded', 'suspicious_activity'
  ]
  
  // Validate action type
  if (!validActionTypes.includes(entry.action_type)) {
    throw new Error(`Invalid action type: ${entry.action_type}`)
  }
  
  return {
    action_type: entry.action_type,
    action_details: entry.action_details || {},
    success: entry.success !== false, // Default to true
    error_message: entry.error_message ? String(entry.error_message).substring(0, 1000) : null,
    session_id: entry.session_id ? String(entry.session_id).substring(0, 255) : null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create service role client for secure logging
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract user ID from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create client with user's token to verify authentication
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body: AuditLogRequest = await req.json()
    
    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid audit log entries' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract client metadata
    const clientIP = extractClientIP(req)
    const userAgent = req.headers.get('user-agent')?.substring(0, 500) || null

    console.log(`Processing ${body.entries.length} audit log entries for user ${user.id}`)

    // Process and insert audit log entries
    const auditEntries = body.entries.map(entry => {
      const sanitized = sanitizeAuditEntry(entry)
      
      return {
        user_id: user.id,
        action_type: sanitized.action_type,
        action_details: sanitized.action_details,
        ip_address: clientIP,
        user_agent: userAgent,
        success: sanitized.success,
        error_message: sanitized.error_message,
        session_id: sanitized.session_id
      }
    })

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditEntries)
      .select('id, created_at')

    if (error) {
      console.error('Failed to insert audit logs:', error)
      throw error
    }

    console.log(`Successfully logged ${data.length} audit entries`)

    // Background task: Check for suspicious activity patterns
    EdgeRuntime.waitUntil(
      detectSuspiciousActivity(supabase, user.id, body.entries)
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        logged_entries: data.length,
        message: 'Audit logs recorded successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in audit-logger function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to record audit logs',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Background task to detect suspicious activity patterns
async function detectSuspiciousActivity(
  supabase: any, 
  userId: string, 
  entries: AuditLogEntry[]
): Promise<void> {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Check for suspicious patterns in the last hour
    const { data: recentLogs, error } = await supabase
      .from('audit_logs')
      .select('action_type, created_at, success')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recent logs for suspicious activity detection:', error)
      return
    }

    let suspiciousActivity = false
    let suspiciousReason = ''

    // Pattern 1: Too many failed attempts
    const failedAttempts = recentLogs.filter(log => !log.success).length
    if (failedAttempts >= 10) {
      suspiciousActivity = true
      suspiciousReason = `High number of failed attempts: ${failedAttempts}`
    }

    // Pattern 2: Rapid successive actions (more than 100 actions in an hour)
    if (recentLogs.length >= 100) {
      suspiciousActivity = true
      suspiciousReason = `Excessive activity: ${recentLogs.length} actions in 1 hour`
    }

    // Pattern 3: Multiple login failures followed by success (potential brute force)
    const loginEvents = recentLogs.filter(log => 
      ['login_attempt', 'login_success', 'login_failure'].includes(log.action_type)
    )
    const recentFailures = loginEvents.slice(0, 5).filter(log => !log.success).length
    const hasRecentSuccess = loginEvents.some(log => log.success)
    
    if (recentFailures >= 3 && hasRecentSuccess) {
      suspiciousActivity = true
      suspiciousReason = 'Potential brute force: multiple failures followed by success'
    }

    // Log suspicious activity
    if (suspiciousActivity) {
      console.warn(`Suspicious activity detected for user ${userId}: ${suspiciousReason}`)
      
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action_type: 'suspicious_activity',
          action_details: {
            reason: suspiciousReason,
            recent_activity_count: recentLogs.length,
            failed_attempts: failedAttempts,
            detected_at: now.toISOString()
          },
          success: true
        })
    }

  } catch (error) {
    console.error('Error in suspicious activity detection:', error)
  }
}