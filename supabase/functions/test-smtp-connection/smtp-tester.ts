
import nodemailer from "npm:nodemailer@6.9.7";
import { SmtpTestRequest, SmtpTestResult } from './types.ts';
import { buildSmtpConfig } from './config-builder.ts';
import { createErrorMessage } from './error-handler.ts';

export async function testSmtpConnection(config: SmtpTestRequest): Promise<SmtpTestResult> {
  const { smtp_host, smtp_port, smtp_username, use_tls } = config;
  
  try {
    console.log(`Testing SMTP connection to ${smtp_host}:${smtp_port} with TLS: ${use_tls}`);
    
    const transporterConfig = buildSmtpConfig(config);

    console.log('Creating SMTP transporter with config:', {
      host: smtp_host,
      port: smtp_port,
      secure: transporterConfig.secure,
      requireTLS: transporterConfig.requireTLS,
      tlsVersion: transporterConfig.tls?.minVersion,
    });

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    
    console.log('SMTP connection verified successfully');

    // Close the transporter
    transporter.close();

    return {
      success: true,
      message: 'SMTP connection and authentication test successful',
      details: {
        host: smtp_host,
        port: smtp_port,
        username: smtp_username,
        use_tls: use_tls,
        connection_type: smtp_port === 465 ? 'Implicit SSL/TLS' : (use_tls ? 'STARTTLS' : 'Plain'),
        tls_version: transporterConfig.tls?.minVersion || 'Not configured',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('SMTP connection test failed:', error);
    
    const errorMessage = createErrorMessage(error, smtp_host, smtp_port);
    throw new Error(errorMessage);
  }
}
