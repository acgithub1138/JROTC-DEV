/**
 * Formats a phone number to (xxx) xxx-xxxx format
 * @param phone - The phone number string to format
 * @returns Formatted phone number or '-' if empty
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (xxx) xxx-xxxx if we have 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
};
