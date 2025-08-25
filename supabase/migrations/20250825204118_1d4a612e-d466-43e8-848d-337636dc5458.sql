-- Remove the conflicting SMTP-based email processor job
SELECT cron.unschedule('process-email-queue-smtp');