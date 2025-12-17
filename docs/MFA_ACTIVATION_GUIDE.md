# MFA Activation Guide

## Overview

This guide explains how to enable Multi-Factor Authentication (MFA) on the ZYX Platform. MFA infrastructure is fully built and tested but currently disabled for the MVP launch. When you're ready to enable MFA, follow this guide.

## Current Status

- **MFA Status**: Disabled (ENABLE_MFA=false)
- **Infrastructure**: Complete and ready
- **Database**: `mfa_settings` table created and indexed
- **API Endpoints**: 8 stub endpoints that return 501 Not Implemented
- **Services**: TOTP and backup codes generation implemented
- **Model**: MFASettings model fully implemented

## Prerequisites

Before enabling MFA, ensure:

1. All users have verified email addresses
2. Email service is working correctly (for backup code delivery)
3. Production environment variables are properly configured
4. SSL/TLS certificates are valid (required for secure cookie transmission)

## Activation Steps

### Step 1: Update Environment Variable

Set the MFA feature flag to `true` in your environment:

```bash
# In .env file
ENABLE_MFA=true
```

Or set the environment variable directly:

```bash
export ENABLE_MFA=true
```

### Step 2: Implement MFA Endpoints

The MFA endpoint stubs are located in `/src/routes/mfaRoutes.ts`. Each endpoint has detailed implementation notes in comments. Implement the following endpoints:

#### 2.1 POST /api/auth/mfa/setup

Generate TOTP secret and backup codes for a user.

**Implementation Steps:**
1. Extract and verify JWT access token from Authorization header
2. Get user ID from JWT payload
3. Check if user already has MFA enabled
4. Generate TOTP secret: `mfaService.generateTOTPSecret(user.email)`
5. Generate backup codes: `mfaService.generateBackupCodes(10)`
6. Hash backup codes: `codes.map(code => mfaService.hashBackupCode(code))`
7. Create or update MFA settings in database
8. Return plain text backup codes (user must save these)

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/ZYX%20Platform%20(user@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=ZYX%20Platform",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    ...
  ]
}
```

#### 2.2 POST /api/auth/mfa/verify

Verify TOTP token to enable MFA.

**Implementation Steps:**
1. Extract and verify JWT access token
2. Get user's MFA settings from database
3. Verify TOTP token: `mfaService.verifyTOTPToken(token, secret)`
4. If valid, set `mfa_settings.enabled = true`
5. Return success response

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "message": "MFA enabled successfully"
}
```

#### 2.3 POST /api/auth/mfa/validate

Validate TOTP token during login.

**Implementation Steps:**
1. Receive userId and token from login flow
2. Get user's MFA settings from database
3. Verify token: `mfaService.verifyTOTPToken(token, secret)`
4. If valid, generate JWT access and refresh tokens
5. Return tokens for authenticated session

**Request Body:**
```json
{
  "userId": "uuid-here",
  "token": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "accessToken": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

#### 2.4 POST /api/auth/mfa/disable

Disable MFA for a user.

**Implementation Steps:**
1. Extract and verify JWT access token
2. Verify user's password (for security)
3. Set `mfa_settings.enabled = false`
4. Clear secret and backup codes
5. Return success response

**Request Body:**
```json
{
  "password": "user-password"
}
```

#### 2.5 POST /api/auth/mfa/regenerate-backup-codes

Generate new backup codes.

**Implementation Steps:**
1. Extract and verify JWT access token
2. Generate new backup codes: `mfaService.generateBackupCodes(10)`
3. Hash codes before storing
4. Update `mfa_settings.backup_codes`
5. Return plain text codes (user must save these)

#### 2.6 POST /api/auth/mfa/use-backup-code

Validate backup code during login.

**Implementation Steps:**
1. Receive userId and backup code from login flow
2. Get user's MFA settings from database
3. Verify backup code: `mfaService.verifyBackupCode(code, hashedCodes)`
4. If valid, remove used code from array
5. Generate JWT tokens and return

#### 2.7 GET /api/auth/mfa/status

Get MFA status for authenticated user.

**Implementation Steps:**
1. Extract and verify JWT access token
2. Get user's MFA settings from database
3. Return enabled status and backup codes count

**Response:**
```json
{
  "enabled": true,
  "backupCodesRemaining": 8
}
```

### Step 3: Update Login Flow

Modify the login endpoint in `/src/routes/authRoutes.ts`:

```typescript
// After password verification
if (user.mfa_enabled) {
  // Don't issue tokens yet
  // Return a temporary token or session ID
  return res.status(200).json({
    requiresMFA: true,
    userId: user.id,
    tempToken: generateTempToken(user.id)
  });
}

// Normal login flow continues...
```

### Step 4: Update Frontend

Add MFA components to the frontend:

1. **MFA Setup Page** (`/settings/security/mfa`)
   - Display QR code from otpauthUrl
   - Show backup codes with "save these codes" warning
   - Verification input for first TOTP code

2. **MFA Login Modal**
   - Show after successful password verification
   - Input for 6-digit TOTP code
   - Link to "Use backup code instead"
   - Option to trust device for 30 days (optional)

3. **Backup Code Modal**
   - Input for backup code
   - Warning that code is single-use
   - Link back to TOTP entry

4. **MFA Management** (in account settings)
   - Show MFA status (enabled/disabled)
   - Button to enable/disable MFA
   - Button to regenerate backup codes
   - Count of remaining backup codes

### Step 5: Testing

Before production deployment, thoroughly test:

1. **Setup Flow**
   - User enables MFA
   - QR code scans correctly in authenticator apps (Google Authenticator, Authy, etc.)
   - Backup codes display and can be saved

2. **Login Flow**
   - User logs in with password
   - MFA prompt appears
   - Valid TOTP code grants access
   - Invalid TOTP code shows error

3. **Backup Code Flow**
   - User uses backup code to login
   - Backup code is consumed (single-use)
   - User can regenerate backup codes

4. **Disable Flow**
   - User can disable MFA with password verification
   - MFA settings cleared from database

5. **Edge Cases**
   - Clock drift (TOTP uses 1-step window)
   - Expired tokens
   - Revoked tokens after logout
   - Multiple devices with same TOTP secret

### Step 6: User Communication

Before enabling MFA, communicate with users:

1. **Email Announcement**
   - Announce MFA availability
   - Explain benefits (account security)
   - Link to setup guide

2. **In-App Banner**
   - Promote MFA setup in dashboard
   - Optional for now, may become mandatory later

3. **Help Documentation**
   - Create user guide for MFA setup
   - Troubleshooting common issues
   - Supported authenticator apps

### Step 7: Database Migration (if needed)

The `mfa_settings` table is already created. No additional migration needed.

To verify the table exists:

```sql
SELECT * FROM mfa_settings LIMIT 1;
```

### Step 8: Monitoring

After enabling MFA, monitor:

1. **Adoption Rate**
   - Track % of users enabling MFA
   - Set adoption goals (e.g., 30% in first month)

2. **Failed MFA Attempts**
   - Alert on unusual spikes (potential brute force)
   - Track backup code usage

3. **Support Tickets**
   - Monitor MFA-related support requests
   - Common issues: lost device, can't scan QR code

4. **Performance**
   - TOTP verification latency (should be < 50ms)
   - Database query performance for `mfa_settings`

## Security Considerations

### TOTP Algorithm

- **Algorithm**: HMAC-SHA1
- **Time Step**: 30 seconds
- **Window**: 1 step (allows 30 seconds clock drift)
- **Secret Length**: 32 bytes (256 bits of entropy)
- **Code Length**: 6 digits

### Backup Codes

- **Generation**: Cryptographically secure random (crypto.randomBytes)
- **Storage**: SHA256 hashed before database storage
- **Count**: 10 codes per user
- **Usage**: Single-use, removed after consumption
- **Format**: 8 characters (hexadecimal)

### Rate Limiting

Consider adding rate limiting to MFA endpoints:

- **TOTP Validation**: 5 attempts per 5 minutes per user
- **Backup Code Validation**: 3 attempts per 5 minutes per user
- **MFA Setup**: 3 attempts per hour per user

### Session Management

After MFA validation:

- Issue regular JWT access and refresh tokens
- Same session length as non-MFA users
- "Trust this device" can extend session (optional feature)

## Rollback Procedure

If issues arise after enabling MFA:

1. **Immediate Rollback**
   ```bash
   export ENABLE_MFA=false
   ```
   All MFA endpoints will immediately return 501 Not Implemented.

2. **Users with MFA Enabled**
   - Users can still login with password only
   - MFA settings remain in database (not deleted)
   - When re-enabled, users continue with existing MFA setup

3. **No Data Loss**
   - MFA settings table persists
   - Secrets and backup codes retained
   - Users don't need to re-setup MFA

## Technical Details

### MFA Service API

The `MFAService` class provides:

```typescript
// Generate TOTP secret
generateTOTPSecret(email: string, issuer?: string): {
  secret: string;
  otpauthUrl: string;
}

// Verify TOTP token
verifyTOTPToken(token: string, secret: string): boolean

// Generate backup codes
generateBackupCodes(count?: number): string[]

// Hash backup code
hashBackupCode(code: string): string

// Verify backup code
verifyBackupCode(code: string, hashedCodes: string[]): number

// Check if MFA is enabled
isMFAEnabled(): boolean
```

### MFASettings Model API

The `MFASettingsModel` class provides:

```typescript
// Create MFA settings
create(user_id: string): Promise<MFASettings>

// Find by user ID
findByUserId(user_id: string): Promise<MFASettings | null>

// Update MFA settings
update(
  user_id: string,
  enabled: boolean,
  secret?: string | null,
  backup_codes?: string[] | null
): Promise<MFASettings | null>

// Delete MFA settings
delete(user_id: string): Promise<boolean>
```

### Database Schema

```sql
CREATE TABLE mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  secret VARCHAR(255),
  backup_codes JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_mfa_settings_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_mfa_settings_user_id ON mfa_settings(user_id);
```

## Support Resources

### User Guides
- How to enable MFA
- Supported authenticator apps
- What to do if you lose your device
- How to use backup codes

### Admin Guides
- How to disable MFA for a user (emergency)
- How to monitor MFA adoption
- Troubleshooting MFA issues

### Authenticator App Recommendations
- Google Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- Microsoft Authenticator (iOS, Android)
- 1Password (iOS, Android, Desktop)

## Frequently Asked Questions

**Q: What happens if a user loses their device?**
A: Users can login with backup codes. If backup codes are also lost, admin intervention is required to disable MFA for the account.

**Q: Can users have MFA on multiple devices?**
A: Yes, the same TOTP secret can be added to multiple authenticator apps.

**Q: How long is a TOTP code valid?**
A: 30 seconds. The system allows a 1-step window (60 seconds total) for clock drift.

**Q: Do backup codes expire?**
A: No, backup codes remain valid until used or regenerated.

**Q: Can MFA be mandatory for all users?**
A: Not in the current implementation. Modify the login flow to enforce MFA requirement.

**Q: What happens during rollback?**
A: All MFA endpoints return 501 Not Implemented. Users can login with password only. MFA settings are preserved.

## Contact

For issues or questions about MFA activation:
- Technical lead: [Name/Email]
- Security team: [Email]
- Documentation: This guide

## Changelog

- **2025-10-27**: Initial MFA infrastructure implementation
- **YYYY-MM-DD**: MFA enabled in production (when activated)
