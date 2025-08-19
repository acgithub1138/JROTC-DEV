import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailQueueItem } from './types.ts';
import { sendEmailViaSupabase } from './email-service.ts';

export class QueueProcessor {
  private supabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async getQueueItems(): Promise<EmailQueueItem[]> {
    const { data: queueItems, error: queueError } = await this.supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (queueError) {
      console.error('Error fetching email queue:', queueError);
      throw queueError;
    }

    return queueItems || [];
  }

  // Removed getGlobalSmtpSettings - no longer needed with Supabase email system

  async markEmailAsSent(itemId: string): Promise<void> {
    const { error: updateError } = await this.supabaseClient
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      console.error(`Error updating email ${itemId}:`, updateError);
      throw updateError;
    }

    // Update task comment if this email is related to a task
    await this.updateTaskComment(itemId);
  }

  async updateTaskComment(queueId: string): Promise<void> {
    try {
      // First get the email queue item to check if it's task-related
      const { data: queueItem, error: queueError } = await this.supabaseClient
        .from('email_queue')
        .select('source_table, record_id, recipient_email')
        .eq('id', queueId)
        .single();

      if (queueError || !queueItem) {
        console.error('Error fetching queue item for comment update:', queueError);
        return;
      }

      // Only update comments for task-related emails
      if (queueItem.source_table === 'tasks') {
        // First, try to update existing comment
        const { data: updatedRows, error: updateError } = await this.supabaseClient
          .from('task_comments')
          .update({
            comment_text: `Email sent to ${queueItem.recipient_email} - [Preview Email](${queueId})`
          })
          .eq('task_id', queueItem.record_id)
          .like('comment_text', `Email queued for sending to ${queueItem.recipient_email}%`)
          .eq('is_system_comment', true)
          .select();

        if (updateError) {
          console.error(`Error updating task comment for email ${queueId}:`, updateError);
          return;
        }

        // If no rows were updated (comment doesn't exist), create a new one
        if (!updatedRows || updatedRows.length === 0) {
          console.log(`No existing comment found for ${queueId}, creating new one`);
          
          // Get the task to find a suitable user_id for the comment
          const { data: taskData, error: taskError } = await this.supabaseClient
            .from('tasks')
            .select('assigned_by, assigned_to')
            .eq('id', queueItem.record_id)
            .single();

          if (taskError) {
            console.error(`Error fetching task for comment creation ${queueId}:`, taskError);
            return;
          }

          const { error: insertError } = await this.supabaseClient
            .from('task_comments')
            .insert({
              task_id: queueItem.record_id,
              user_id: taskData.assigned_by || taskData.assigned_to,
              comment_text: `Email sent to ${queueItem.recipient_email} - [Preview Email](${queueId})`,
              is_system_comment: true
            });

          if (insertError) {
            console.error(`Error creating task comment for email ${queueId}:`, insertError);
          } else {
            console.log(`Created new task comment for email ${queueId}`);
          }
        } else {
          console.log(`Updated existing task comment for email ${queueId}`);
        }
      }
    } catch (error) {
      console.error(`Error in updateTaskComment for ${queueId}:`, error);
    }
  }

  async markEmailAsFailed(itemId: string, errorMessage: string): Promise<void> {
    await this.supabaseClient
      .from('email_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);
  }

  async createEmailLog(queueId: string, eventType: string, eventData: any): Promise<void> {
    const { error: logError } = await this.supabaseClient
      .from('email_logs')
      .insert({
        queue_id: queueId,
        event_type: eventType,
        event_data: eventData
      });

    if (logError) {
      console.error(`Error creating log for email ${queueId}:`, logError);
    }
  }

  async processEmails(queueItems: EmailQueueItem[]): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    console.log(`Processing ${queueItems.length} emails via Supabase email system`);

    for (const item of queueItems) {
      try {
        console.log(`Processing email queue item ${item.id} for ${item.recipient_email}`);
        
        // Log the email being processed
        await this.createEmailLog(item.id, 'processing', { 
          recipient: item.recipient_email,
          subject: item.subject 
        });

        // Send the email via Supabase
        await sendEmailViaSupabase(item);

        // Mark as sent and update task comment if needed
        await this.markEmailAsSent(item.id);
        processed++;

        console.log(`Email sent successfully: ${item.id}`);

        // Log successful sending
        await this.createEmailLog(item.id, 'sent', { 
          recipient: item.recipient_email,
          message_id: 'supabase-email'
        });

      } catch (error) {
        console.error(`Failed to send email ${item.id}:`, error);
        
        const errorMessage = `Email sending failed: ${error.message || 'Unknown error'}`;
        await this.markEmailAsFailed(item.id, errorMessage);
        failed++;

        // Log the failure
        await this.createEmailLog(item.id, 'failed', { 
          error: errorMessage,
          recipient: item.recipient_email
        });
      }
    }

    return { processed, failed };
  }

  async handleNoEmailService(queueItems: EmailQueueItem[]): Promise<void> {
    console.log(`Marking ${queueItems.length} emails as failed due to email service unavailable`);
    
    for (const item of queueItems) {
      await this.markEmailAsFailed(
        item.id, 
        'Email service is currently unavailable. Please check your Supabase configuration.'
      );
    }
  }
}