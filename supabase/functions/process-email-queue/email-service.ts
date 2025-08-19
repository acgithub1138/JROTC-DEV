import { EmailQueueItem } from './types.ts';

export async function sendEmailViaSupabase(
  emailData: EmailQueueItem
): Promise<boolean> {
  try {
    console.log(`Attempting to send email via Supabase to ${emailData.recipient_email}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call our send-email-hook function directly
    const emailHookUrl = `${supabaseUrl}/functions/v1/send-email-hook`;
    
    const response = await fetch(emailHookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to: emailData.recipient_email,
        subject: emailData.subject,
        html: emailData.body,
        from: 'JROTC Management <noreply@yourdomain.com>',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email sending failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Email sent successfully via Supabase:`, result);
    
    return true;
    
  } catch (error) {
    console.error(`Supabase email sending failed:`, error);
    throw error;
  }
}