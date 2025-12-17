import bcrypt from 'bcryptjs';

/**
 * Service for handling password hashing and validation
 */
export class PasswordService {
  private readonly BCRYPT_COST_FACTOR = 10;
  // Updated regex to allow more special characters including # and others commonly used
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  /**
   * Hash a password using bcrypt with cost factor 10
   * @param password - Plain text password to hash
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.BCRYPT_COST_FACTOR);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password to verify
   * @param hash - Hashed password to compare against
   * @returns True if password matches hash, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength requirements
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character (@$!%*?&)
   * @param password - Password to validate
   * @returns True if password meets requirements, false otherwise
   */
  validatePasswordStrength(password: string): boolean {
    // Check minimum length
    if (password.length < 8) {
      return false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      return false;
    }

    // Check for at least one special character
    if (!/[@$!%*?&]/.test(password)) {
      return false;
    }

    // Check that password only contains allowed characters
    if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Get password requirements description for user-facing messages
   * @returns String describing password requirements
   */
  getPasswordRequirements(): string {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
  }
}
