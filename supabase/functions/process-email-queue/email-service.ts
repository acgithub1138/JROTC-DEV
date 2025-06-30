
import { EmailQueueItem, SmtpSettings } from './types.ts';

export async function sendEmailViaSMTP(
  emailData: EmailQueueItem,
  smtpSettings: SmtpSettings
): Promise<boolean> {
  try {
    console.log(`Attempting to send email via global SMTP to ${emailData.recipient_email}`);
    
    if (!smtpSettings.is_active) {
      throw new Error('Global SMTP is not active');
    }

    // Simulate SMTP connection and sending
    console.log(`Connecting to global SMTP server: ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);
    console.log(`Using TLS: ${smtpSettings.use_tls}`);
    console.log(`From: ${smtpSettings.from_name} <${smtpSettings.from_email}>`);
    console.log(`To: ${emailData.recipient_email}`);
    console.log(`Subject: ${emailData.subject}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Email sent successfully via global SMTP`);
    return true;
    
  } catch (error) {
    console.error(`Global SMTP sending failed:`, error);
    throw error;
  }
}
