
import { SmtpTestRequest, SmtpTransporterConfig } from './types.ts';

export function buildSmtpConfig(config: SmtpTestRequest): SmtpTransporterConfig {
  const { smtp_host, smtp_port, smtp_username, smtp_password, use_tls } = config;
  
  // Base configuration
  let transporterConfig: SmtpTransporterConfig = {
    host: smtp_host,
    port: smtp_port,
    auth: {
      user: smtp_username,
      pass: smtp_password,
    },
    connectionTimeout: 30000, // 30 seconds for Network Solutions
    greetingTimeout: 15000,
    socketTimeout: 15000,
  };

  // Configure TLS/SSL based on port and user preference
  if (smtp_port === 465) {
    // Implicit SSL for port 465
    transporterConfig.secure = true;
    transporterConfig.tls = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      rejectUnauthorized: true,
    };
  } else if (use_tls && (smtp_port === 587 || smtp_port === 25)) {
    // Explicit TLS (STARTTLS) for port 587 or 25
    transporterConfig.secure = false;
    transporterConfig.requireTLS = true;
    transporterConfig.tls = {
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      rejectUnauthorized: true,
      // Network Solutions specific TLS configuration
      servername: smtp_host,
    };
  } else {
    // No encryption
    transporterConfig.secure = false;
  }

  return transporterConfig;
}
