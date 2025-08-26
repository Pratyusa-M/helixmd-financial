DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.audit_logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_action_created ON public.audit_logs(action_type, created_at DESC);
  END IF;
END $$;

-- Optional; comment out unless pg_cron is enabled:
-- SELECT cron.schedule('purge_old_audit_logs', '0 3 * * *',
-- $$ DELETE FROM public.audit_logs WHERE created_at < now() - interval '180 days' $$);