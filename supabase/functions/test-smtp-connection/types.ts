
export interface SmtpTestRequest {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    username: string;
    use_tls: boolean;
    connection_type: string;
    tls_version: string;
    timestamp: string;
  };
}

export interface SmtpTransporterConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
  secure?: boolean;
  requireTLS?: boolean;
  tls?: {
    minVersion: string;
    maxVersion: string;
    rejectUnauthorized: boolean;
    servername?: string;
  };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}
