
import { SmtpTestRequest } from './types.ts';

export function validateSmtpRequest(config: SmtpTestRequest): { isValid: boolean; error?: string } {
  // Basic validation
  if (!config.smtp_host || !config.smtp_username || !config.smtp_password || !config.from_email) {
    return {
      isValid: false,
      error: 'Missing required fields: smtp_host, smtp_username, smtp_password, from_email'
    };
  }

  // Validate email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.from_email)) {
    return {
      isValid: false,
      error: 'Please provide a valid email address for from_email'
    };
  }

  if (!emailRegex.test(config.smtp_username)) {
    return {
      isValid: false,
      error: 'Please provide a valid email address for smtp_username'
    };
  }

  // Validate port
  if (config.smtp_port < 1 || config.smtp_port > 65535) {
    return {
      isValid: false,
      error: 'Port must be between 1 and 65535'
    };
  }

  return { isValid: true };
}
