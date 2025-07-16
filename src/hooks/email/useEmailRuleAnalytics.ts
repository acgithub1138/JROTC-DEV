import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailRuleUsageStats {
  rule_id: string;
  rule_type: string;
  total_triggers: number;
  successful_triggers: number;
  failed_triggers: number;
  success_rate: number;
  avg_processing_time_ms: number;
  last_triggered: string;
  recipient_emails: string[];
}

export interface EmailRuleUsageLogEntry {
  id: string;
  rule_id: string;
  triggered_at: string;
  trigger_table: string;
  trigger_operation: string;
  record_id: string;
  recipient_email: string;
  success: boolean;
  error_message: string | null;
  processing_time_ms: number | null;
}

export const useEmailRuleAnalytics = () => {
  const { data: usageStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["email-rule-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_rule_usage_log")
        .select(`
          rule_id,
          success,
          processing_time_ms,
          triggered_at,
          recipient_email,
          email_rules!inner(rule_type)
        `)
        .gte("triggered_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order("triggered_at", { ascending: false });

      if (error) throw error;

      // Aggregate stats by rule_id
      const statsMap = new Map<string, EmailRuleUsageStats>();

      data?.forEach((entry: any) => {
        const ruleId = entry.rule_id;
        const existing = statsMap.get(ruleId);

        if (!existing) {
          statsMap.set(ruleId, {
            rule_id: ruleId,
            rule_type: entry.email_rules.rule_type,
            total_triggers: 1,
            successful_triggers: entry.success ? 1 : 0,
            failed_triggers: entry.success ? 0 : 1,
            success_rate: entry.success ? 100 : 0,
            avg_processing_time_ms: entry.processing_time_ms || 0,
            last_triggered: entry.triggered_at,
            recipient_emails: [entry.recipient_email],
          });
        } else {
          existing.total_triggers++;
          if (entry.success) {
            existing.successful_triggers++;
          } else {
            existing.failed_triggers++;
          }
          existing.success_rate = (existing.successful_triggers / existing.total_triggers) * 100;
          
          // Update average processing time
          if (entry.processing_time_ms) {
            existing.avg_processing_time_ms = 
              (existing.avg_processing_time_ms + entry.processing_time_ms) / 2;
          }

          // Add unique recipient emails
          if (!existing.recipient_emails.includes(entry.recipient_email)) {
            existing.recipient_emails.push(entry.recipient_email);
          }

          // Update last triggered if this entry is more recent
          if (new Date(entry.triggered_at) > new Date(existing.last_triggered)) {
            existing.last_triggered = entry.triggered_at;
          }
        }
      });

      return Array.from(statsMap.values());
    },
  });

  const { data: recentLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["email-rule-recent-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_rule_usage_log")
        .select("*")
        .order("triggered_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as EmailRuleUsageLogEntry[];
    },
  });

  return {
    usageStats: usageStats || [],
    recentLogs: recentLogs || [],
    isLoading: isLoadingStats || isLoadingLogs,
  };
};