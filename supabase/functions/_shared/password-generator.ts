/**
 * Generates a cryptographically secure random password
 * @param length - Length of the password (default: 12)
 * @returns Generated password string
 */
export function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Helper function to get a cryptographically secure random index
  const getSecureRandomIndex = (max: number): number => {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
  };
  
  // Ensure at least one character from each category
  let password = '';
  password += lowercase[getSecureRandomIndex(lowercase.length)];
  password += uppercase[getSecureRandomIndex(uppercase.length)];
  password += numbers[getSecureRandomIndex(numbers.length)];
  password += symbols[getSecureRandomIndex(symbols.length)];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[getSecureRandomIndex(allChars.length)];
  }
  
  // Shuffle the password using Fisher-Yates with crypto random
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
}