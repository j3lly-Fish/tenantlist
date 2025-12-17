import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

/**
 * MFAService - Multi-Factor Authentication Service
 *
 * Built for MVP but currently disabled (ENABLE_MFA=false)
 * Ready for future activation when needed
 *
 * Provides:
 * - TOTP (Time-based One-Time Password) secret generation
 * - Backup codes generation for account recovery
 * - TOTP verification (currently not called)
 */
export class MFAService {
  /**
   * Generate a TOTP secret for a user
   * Uses base32 encoding as required by TOTP standard
   *
   * @param email - User's email for labeling in authenticator apps
   * @param issuer - Application name (default: 'ZYX Platform')
   * @returns Object containing secret and otpauth URL for QR code generation
   */
  generateTOTPSecret(email: string, issuer: string = 'ZYX Platform'): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${email})`,
      issuer: issuer,
      length: 32, // 32 bytes = 256 bits of entropy
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
    };
  }

  /**
   * Verify a TOTP token against a secret
   * Uses 30-second time window with 1-step window for clock drift tolerance
   *
   * @param token - 6-digit TOTP code from authenticator app
   * @param secret - Base32-encoded TOTP secret
   * @returns True if token is valid, false otherwise
   */
  verifyTOTPToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1, // Allow 1 time step before/after for clock drift
    });
  }

  /**
   * Generate backup codes for MFA recovery
   * Creates cryptographically secure random codes
   *
   * @param count - Number of backup codes to generate (default: 10)
   * @returns Array of backup codes (8 characters each)
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 4 random bytes and convert to hex (8 characters)
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash a backup code for secure storage
   * Uses SHA256 to hash the code before storing in database
   *
   * @param code - Backup code to hash
   * @returns Hashed backup code (hex string)
   */
  hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify a backup code against stored hashed codes
   * Hashes the provided code and checks if it matches any stored hash
   *
   * @param code - Backup code provided by user
   * @param hashedCodes - Array of hashed backup codes from database
   * @returns Index of matching code if valid, -1 if not found
   */
  verifyBackupCode(code: string, hashedCodes: string[]): number {
    const hashedInput = this.hashBackupCode(code);
    return hashedCodes.findIndex(hash => hash === hashedInput);
  }

  /**
   * Check if MFA is enabled in the environment
   * Reads ENABLE_MFA environment variable
   *
   * @returns True if MFA is enabled, false otherwise
   */
  isMFAEnabled(): boolean {
    return process.env.ENABLE_MFA === 'true';
  }
}
