import nodemailer from "https://esm.sh/nodemailer@6.9.7";
import { EmailQueueItem, SmtpSettings } from "./types.ts";

export async function sendEmailViaSMTP(emailData: EmailQueueItem, smtpSettings: SmtpSettings): Promise<boolean> {
  try {
    console.log(`Attempting to send email via SMTP to ${emailData.recipient_email}`);

    if (!smtpSettings.is_active) {
      throw new Error("Global SMTP is not active");
    }

    // Build SMTP configuration
    let transporterConfig: any = {
      host: smtpSettings.smtp_host,
      port: smtpSettings.smtp_port,
      auth: {
        user: smtpSettings.smtp_username,
        pass: smtpSettings.smtp_password,
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    };

    // Configure TLS/SSL based on port and user preference
    if (smtpSettings.smtp_port === 465) {
      // Implicit SSL for port 465
      transporterConfig.secure = true;
      transporterConfig.tls = {
        minVersion: "TLSv1.2",
        maxVersion: "TLSv1.3",
        rejectUnauthorized: true,
      };
    } else if (smtpSettings.use_tls && (smtpSettings.smtp_port === 587 || smtpSettings.smtp_port === 25)) {
      // Explicit TLS (STARTTLS) for port 587 or 25
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
      transporterConfig.tls = {
        minVersion: "TLSv1.2",
        maxVersion: "TLSv1.3",
        rejectUnauthorized: true,
        servername: smtpSettings.smtp_host,
      };
    } else {
      // No encryption
      transporterConfig.secure = false;
    }

    console.log(`Creating SMTP transporter for ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Prepare email options
    const mailOptions = {
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      to: emailData.recipient_email,
      subject: emailData.subject,
      html: emailData.body,
    };

    console.log(`Sending email from ${mailOptions.from} to ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);

    // Send the email
    const result = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully:`, result.messageId);

    // Close the transporter
    transporter.close();

    return true;
  } catch (error) {
    console.error(`SMTP sending failed:`, error);
    throw error;
  }
}
