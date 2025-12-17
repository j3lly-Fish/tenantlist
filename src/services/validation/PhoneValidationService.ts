import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Service for validating phone numbers
 * Uses E.164 standard format validation
 */
export class PhoneValidationService {
  /**
   * Validate phone number format using E.164 standard
   * E.164 format: +[country code][subscriber number]
   * Example: +12125551234
   *
   * @param phone - Phone number to validate
   * @returns True if valid, false otherwise
   */
  isValidPhoneNumber(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    try {
      // Check if phone number is valid
      return isValidPhoneNumber(phone);
    } catch (error) {
      return false;
    }
  }

  /**
   * Format phone number to E.164 standard
   * @param phone - Phone number to format
   * @returns Formatted phone number or null if invalid
   */
  formatPhoneNumber(phone: string): string | null {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    try {
      const phoneNumber = parsePhoneNumber(phone);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate and format phone number
   * @param phone - Phone number to validate and format
   * @returns Formatted phone number
   * @throws Error if phone number is invalid
   */
  validateAndFormat(phone: string): string {
    if (!this.isValidPhoneNumber(phone)) {
      throw new Error('Phone number must be in E.164 format (e.g., +12125551234)');
    }

    const formatted = this.formatPhoneNumber(phone);
    if (!formatted) {
      throw new Error('Phone number must be in E.164 format (e.g., +12125551234)');
    }

    return formatted;
  }
}
