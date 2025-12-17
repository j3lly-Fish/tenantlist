import { PhoneValidationService } from '../../../services/validation/PhoneValidationService';

/**
 * Phone Validation Service Tests
 * Tests for Task Group 7: Phone Number Validation
 *
 * Test Coverage:
 * - Validates E.164 format phone numbers
 * - Rejects invalid phone number formats
 * - Formats phone numbers to E.164 standard
 */

describe('PhoneValidationService', () => {
  let phoneValidationService: PhoneValidationService;

  beforeEach(() => {
    phoneValidationService = new PhoneValidationService();
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct E.164 format phone numbers', () => {
      const validNumbers = [
        '+12125551234', // US number
        '+14155552345', // US number (San Francisco)
        '+442071234567', // UK number
        '+33123456789', // France number
        '+81312345678', // Japan number
      ];

      validNumbers.forEach((phone) => {
        expect(phoneValidationService.isValidPhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidNumbers = [
        '123-456-7890', // Missing country code, has dashes
        '(212) 555-1234', // US format with parentheses
        '12125551234', // Missing + symbol
        '555-1234', // Incomplete number
        'not-a-phone', // Invalid characters
        '+1234', // Too short
        '', // Empty string
        '+', // Just a plus sign
      ];

      invalidNumbers.forEach((phone) => {
        expect(phoneValidationService.isValidPhoneNumber(phone)).toBe(false);
      });
    });

    it('should reject null or undefined values', () => {
      expect(phoneValidationService.isValidPhoneNumber(null as any)).toBe(false);
      expect(phoneValidationService.isValidPhoneNumber(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(phoneValidationService.isValidPhoneNumber(123456789 as any)).toBe(false);
      expect(phoneValidationService.isValidPhoneNumber({} as any)).toBe(false);
      expect(phoneValidationService.isValidPhoneNumber([] as any)).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format valid phone numbers to E.164 standard', () => {
      const testCases = [
        { input: '+1 (212) 555-1234', expected: '+12125551234' },
        { input: '+1-212-555-1234', expected: '+12125551234' },
        { input: '+12125551234', expected: '+12125551234' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = phoneValidationService.formatPhoneNumber(input);
        expect(result).toBe(expected);
      });
    });

    it('should return null for invalid phone numbers', () => {
      const invalidNumbers = [
        '123-456-7890',
        '(212) 555-1234',
        'not-a-phone',
        '',
      ];

      invalidNumbers.forEach((phone) => {
        expect(phoneValidationService.formatPhoneNumber(phone)).toBeNull();
      });
    });

    it('should return null for null or undefined values', () => {
      expect(phoneValidationService.formatPhoneNumber(null as any)).toBeNull();
      expect(phoneValidationService.formatPhoneNumber(undefined as any)).toBeNull();
    });
  });

  describe('validateAndFormat', () => {
    it('should validate and format correct phone numbers', () => {
      const testCases = [
        { input: '+12125551234', expected: '+12125551234' },
        { input: '+1 (212) 555-1234', expected: '+12125551234' },
        { input: '+14155552345', expected: '+14155552345' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = phoneValidationService.validateAndFormat(input);
        expect(result).toBe(expected);
      });
    });

    it('should throw error for invalid phone numbers', () => {
      const invalidNumbers = [
        '123-456-7890',
        '(212) 555-1234',
        '12125551234',
        'not-a-phone',
      ];

      invalidNumbers.forEach((phone) => {
        expect(() => phoneValidationService.validateAndFormat(phone)).toThrow(
          'Phone number must be in E.164 format'
        );
      });
    });

    it('should throw error for empty string', () => {
      expect(() => phoneValidationService.validateAndFormat('')).toThrow(
        'Phone number must be in E.164 format'
      );
    });
  });
});
