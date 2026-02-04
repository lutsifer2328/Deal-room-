/**
 * Generate a secure random password for new user invitations
 */
export function generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O for clarity
    const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Removed l for clarity
    const numbers = '23456789'; // Removed 0, 1 for clarity
    const symbols = '!@#$%&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
