
export function createErrorMessage(error: any, smtp_host: string, smtp_port: number): string {
  let errorMessage = 'SMTP connection test failed';
  
  if (error.code === 'ECONNREFUSED') {
    errorMessage = `Cannot connect to SMTP server ${smtp_host}:${smtp_port}. The server may be down or the port may be blocked.`;
  } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    errorMessage = `Connection to ${smtp_host}:${smtp_port} timed out. Network Solutions servers may be slow to respond. Try increasing timeout values.`;
  } else if (error.code === 'EAUTH' || error.responseCode === 535 || error.message.includes('authentication')) {
    errorMessage = 'SMTP authentication failed. Please verify your username and password are correct for Network Solutions.';
  } else if (error.code === 'ESOCKET' || error.message.includes('TLS') || error.message.includes('SSL')) {
    errorMessage = `TLS/SSL connection failed. Network Solutions requires TLS 1.2+. Please verify the TLS setting is correct for port ${smtp_port}.`;
  } else if (error.responseCode === 550) {
    errorMessage = `SMTP server rejected the connection. Network Solutions may not allow connections from this IP address.`;
  } else if (error.responseCode && error.response) {
    errorMessage = `SMTP server error (${error.responseCode}): ${error.response}`;
  } else if (error.message.includes('certificate')) {
    errorMessage = `SSL certificate verification failed. Network Solutions certificate may not be trusted.`;
  }

  return errorMessage;
}
