// DO NOT EDIT //
// DO NOT EDIT //

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  retry_count: number;
  max_retries: number;
  school_id: string;
  created_at: string;
  scheduled_at: string;
  next_retry_at?: string;
  last_attempt_at?: string;
  error_message?: string;
  source_table?: string;
  record_id?: string;
  rule_id?: string;
}

class UnifiedEmailProcessor {
  private static instance: UnifiedEmailProcessor;
  private supabase: any;
  private resend: Resend | null;
  private lastEmailSent: number = 0;
  private readonly RATE_LIMIT_MS = 2000; // 2 seconds between emails
  private processingLock = false;

  private constructor() {
    this.supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log(`🔑 Resend API key configured: ${resendApiKey ? "YES" : "NO"}`);

    // Only initialize Resend if API key is available
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    } else {
      this.resend = null;
      console.error("❌ RESEND_API_KEY not found in environment variables");
    }
  }

  public static getInstance(): UnifiedEmailProcessor {
    if (!UnifiedEmailProcessor.instance) {
      UnifiedEmailProcessor.instance = new UnifiedEmailProcessor();
    }
    return UnifiedEmailProcessor.instance;
  }

  private async acquireLock(lockId: string): Promise<boolean> {
    try {
      // First, clear any stale locks automatically
      await this.clearStaleLocks();

      const { data, error } = await this.supabase
        .from("email_processing_lock")
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: lockId,
        })
        .eq("id", 1)
        .eq("is_locked", false)
        .select();

      if (error) {
        console.error("🔒 Lock acquisition error:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("🔒 Lock acquisition failed:", error);
      return false;
    }
  }

  private async clearStaleLocks(): Promise<void> {
    try {
      const { data, error } = await this.supabase.rpc("clear_stale_email_processing_locks");

      if (error) {
        console.error("🧹 Error clearing stale locks:", error);
      } else if (data > 0) {
        console.log(`🧹 Cleared ${data} stale email processing locks`);
      }
    } catch (error) {
      console.error("🧹 Failed to clear stale locks:", error);
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      await this.supabase
        .from("email_processing_lock")
        .update({
          is_locked: false,
          locked_at: null,
          locked_by: null,
          last_processed_at: new Date().toISOString(),
        })
        .eq("id", 1);
    } catch (error) {
      console.error("🔓 Lock release failed:", error);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSent;

    if (timeSinceLastEmail < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastEmail;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastEmailSent = Date.now();
  }

  private async getPendingEmails(limit: number = 10): Promise<EmailQueueItem[]> {
    const { data, error } = await this.supabase
      .from("email_queue")
      .select("*")
      .in("status", ["pending", "rate_limited"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .lte("scheduled_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("📋 Error fetching pending emails:", error);
      return [];
    }

    return data || [];
  }

  private async getStuckEmails(): Promise<EmailQueueItem[]> {
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    // Get stuck emails with a raw query since we need to compare columns
    const { data, error } = await this.supabase.rpc("get_stuck_emails", {
      threshold_time: thirtySecondsAgo,
    });

    if (error) {
      console.error("🔄 Error fetching stuck emails:", error);
      return [];
    }

    return data || [];
  }

  private async markEmailAsProcessing(emailId: string): Promise<void> {
    await this.supabase
      .from("email_queue")
      .update({
        status: "processing",
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", emailId);
  }

  private async sendEmailViaResend(
    email: EmailQueueItem,
  ): Promise<{ success: boolean; resendId?: string; isRateLimited?: boolean; errorMessage?: string }> {
    try {
      // Check if Resend is properly initialized
      if (!this.resend) {
        const errorMsg = "Resend client not initialized - API key missing";
        console.error(`❌ ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      // Check if recipient_email contains multiple recipients (comma-separated)
      const recipients = email.recipient_email
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      const recipientCount = recipients.length;

      console.log(
        `📧 Sending email to ${recipientCount} recipient(s): ${email.recipient_email} (retry: ${email.retry_count || 0})`,
      );

      const result = await this.resend.emails.send({
        from: "JROTC CCC <noreply@jrotc.us>",
        to: recipients,
        subject: email.subject,
        html: email.body,
      });

      // Only consider successful if we have a valid Resend ID
      if (result.data?.id) {
        console.log(
          `✅ Email sent successfully via Resend to ${recipientCount} recipient(s), Resend ID: ${result.data.id}`,
        );
        return { success: true, resendId: result.data.id };
      } else {
        console.log(`⚠️ Resend API returned success but no ID for ${recipientCount} recipient(s):`, result);
        return { success: false, errorMessage: "No Resend ID returned" };
      }
    } catch (error: any) {
      const recipients = email.recipient_email
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      console.error(`❌ Resend error for ${recipients.length} recipient(s):`, error);

      // Check if this is a rate limiting error
      const isRateLimited = error.message?.includes("rate") || error.message?.includes("limit") || error.status === 429;

      if (isRateLimited) {
        console.log(`🚦 Rate limited by Resend for ${recipients.length} recipient(s)`);
        return { success: false, isRateLimited: true, errorMessage: error.message };
      }

      return { success: false, errorMessage: error.message };
    }
  }

  private async updateEmailStatus(
    email: EmailQueueItem,
    result: { success: boolean; resendId?: string; isRateLimited?: boolean; errorMessage?: string },
  ): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (result.success && result.resendId) {
      // Only mark as sent if we have a valid Resend ID
      updateData.status = "sent";
      updateData.sent_at = new Date().toISOString();
      console.log(`✅ Email ${email.id} marked as sent with Resend ID: ${result.resendId}`);

      // Check if this was a task_information_needed email and update status accordingly
      if (email.source_table && email.record_id) {
        try {
          // Get the rule type to determine if we need to update task status
          let ruleType = null;

          // First get the rule_id from the current email if not already available
          const ruleId = email.rule_id;

          if (ruleId) {
            // Get the rule type from email_rules table
            const { data: ruleData, error: ruleError } = await this.supabase
              .from("email_rules")
              .select("rule_type")
              .eq("id", ruleId)
              .single();

            if (ruleError) {
              console.error("Error fetching rule type:", ruleError);
            } else {
              ruleType = ruleData?.rule_type;
              console.log(`📋 Rule type for email ${email.id}: ${ruleType}`);
            }
          } else {
            console.log(`⚠️ No rule_id found for email ${email.id}`);
          }

          if (ruleType === "task_information_needed" || ruleType === "subtask_information_needed") {
            // Call the status update function
            await this.supabase.functions.invoke("update-task-status-after-email", {
              body: {
                taskId: email.record_id,
                sourceTable: email.source_table,
                emailRuleType: ruleType,
              },
            });
            console.log(`📧 Triggered status update for ${email.source_table} ${email.record_id}`);
          }
        } catch (statusUpdateError) {
          console.error("Error updating task status after email:", statusUpdateError);
          // Don't fail the email processing if status update fails
        }
      }
    } else if (result.isRateLimited) {
      // Handle rate limiting specifically - mark as rate_limited for better tracking
      updateData.status = "rate_limited";
      updateData.retry_count = (email.retry_count || 0) + 1;
      updateData.error_message = result.errorMessage;

      // Shorter retry for rate limiting (1 minute)
      updateData.next_retry_at = new Date(Date.now() + 60000).toISOString();
      console.log(`🚦 Email ${email.id} rate limited, will retry in 1 minute`);
    } else {
      // Regular failure
      updateData.retry_count = (email.retry_count || 0) + 1;
      updateData.error_message = result.errorMessage;

      // Set next retry time with exponential backoff if retries remaining
      if (updateData.retry_count < (email.max_retries || 3)) {
        const retryDelayMinutes = Math.pow(2, updateData.retry_count) * 5; // 5, 10, 20 minutes
        updateData.next_retry_at = new Date(Date.now() + retryDelayMinutes * 60000).toISOString();
        updateData.status = "pending"; // Keep as pending for retry
        console.log(
          `🔄 Email ${email.id} failed, will retry in ${retryDelayMinutes} minutes (attempt ${updateData.retry_count})`,
        );
      } else {
        updateData.status = "failed";
        console.log(`❌ Email ${email.id} failed permanently after ${updateData.retry_count} attempts`);
      }
    }

    await this.supabase.from("email_queue").update(updateData).eq("id", email.id);
  }

  public async processEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: email, error } = await this.supabase.from("email_queue").select("*").eq("id", emailId).single();

      if (error || !email) {
        return { success: false, error: "Email not found" };
      }

      if (!["pending", "rate_limited"].includes(email.status)) {
        return { success: false, error: "Email is not pending or rate limited" };
      }

      await this.markEmailAsProcessing(emailId);
      await this.enforceRateLimit();

      const result = await this.sendEmailViaResend(email);
      await this.updateEmailStatus(email, result);

      return { success: result.success };
    } catch (error: any) {
      console.error(`💥 Error processing email ${emailId}:`, error);
      return { success: false, error: error.message };
    }
  }

  public async processAllEmails(
    includeStuck: boolean = false,
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.processingLock) {
      console.log("🔒 Processing already in progress, skipping");
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const lockId = `processor-${Date.now()}`;
    const lockAcquired = await this.acquireLock(lockId);

    if (!lockAcquired) {
      console.log("🔒 Could not acquire processing lock");
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.processingLock = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      console.log("🚀 Starting unified email processing");

      // Get pending emails
      const pendingEmails = await this.getPendingEmails(10);
      console.log(`📋 Found ${pendingEmails.length} pending emails`);

      // Get stuck emails if requested
      let stuckEmails: EmailQueueItem[] = [];
      if (includeStuck) {
        stuckEmails = await this.getStuckEmails();
        console.log(`🔄 Found ${stuckEmails.length} stuck emails`);
      }

      // Combine and deduplicate emails
      const allEmails = [...pendingEmails, ...stuckEmails];
      const uniqueEmails = allEmails.filter((email, index, self) => index === self.findIndex((e) => e.id === email.id));

      console.log(`📨 Processing ${uniqueEmails.length} unique emails`);

      // Process each email with rate limiting
      for (const email of uniqueEmails) {
        processed++;

        await this.markEmailAsProcessing(email.id);
        await this.enforceRateLimit();

        const result = await this.sendEmailViaResend(email);
        await this.updateEmailStatus(email, result);

        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }

        console.log(`📊 Progress: ${processed}/${uniqueEmails.length} (✅${succeeded} ❌${failed})`);
      }

      console.log(`✅ Email processing complete: ${succeeded}/${processed} succeeded`);

      return { processed, succeeded, failed };
    } catch (error: any) {
      console.error("💥 Error in processAllEmails:", error);
      return { processed, succeeded, failed };
    } finally {
      this.processingLock = false;
      await this.releaseLock();
    }
  }
}

serve(async (req) => {
  console.log("🔥 Function starting");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("📋 CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] Unified Email Processor started`);

  try {
    const body = await req.json();
    console.log(`📝 [${requestId}] Request body:`, JSON.stringify(body));

    const processor = UnifiedEmailProcessor.getInstance();

    // Handle single email processing
    if (body.email_id) {
      console.log(`📧 [${requestId}] Processing single email: ${body.email_id}`);
      const result = await processor.processEmail(body.email_id);

      return new Response(
        JSON.stringify({
          success: result.success,
          error: result.error,
          requestId,
        }),
        {
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle batch processing (scheduled or manual)
    if (body.process_all || body.scheduled) {
      console.log(`📋 [${requestId}] Processing all emails (includeStuck: ${body.scheduled})`);
      const result = await processor.processAllEmails(body.scheduled);

      console.log(
        `✅ [${requestId}] Processing complete: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          requestId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`❌ [${requestId}] Invalid request - no valid parameters found`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request: missing email_id or process_all parameter",
        requestId,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error(`💥 [${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        requestId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
