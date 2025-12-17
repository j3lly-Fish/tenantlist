# Database Layer Documentation

## Overview
This directory contains database migrations, models, and seed data for the TenantList platform.

## Directory Structure
```
src/database/
├── migrations/          # Database schema migrations
├── models/             # Database models (using raw SQL with pg)
├── seeds/              # Seed data for development
├── migrate.ts          # Migration runner script
└── README.md           # This file
```

## Running Migrations

### Apply all migrations (up)
```bash
npm run migrate:up
```

### Rollback last migration (down)
```bash
npm run migrate:down
```

## Available Migrations

### Core Authentication Tables
1. `001-create-enums.ts` - Creates PostgreSQL enum types (user_role, oauth_provider, business_status)
2. `002-create-users-table.ts` - Creates users table
3. `003-create-user-profiles-table.ts` - Creates user_profiles table
4. `004-create-oauth-accounts-table.ts` - Creates oauth_accounts table
5. `005-create-refresh-tokens-table.ts` - Creates refresh_tokens table
6. `006-create-password-reset-tokens-table.ts` - Creates password_reset_tokens table
7. `007-create-mfa-settings-table.ts` - Creates mfa_settings table

### Business & Dashboard Tables (Task Group 2)
8. `008-create-businesses-table.ts` - Creates businesses table
9. `009-create-business-locations-table.ts` - Creates business_locations table
10. `010-create-business-metrics-table.ts` - Creates business_metrics table

## Database Models

### Authentication Models
- `User.ts` - User account management
- `UserProfile.ts` - User profile data
- `OAuthAccount.ts` - OAuth provider accounts
- `RefreshToken.ts` - JWT refresh tokens
- `PasswordResetToken.ts` - Password reset tokens
- `MFASettings.ts` - Multi-factor authentication settings

### Business Models (Task Group 2)
- `Business.ts` - Business entity management
  - Methods: create, findById, findByUserId, findByUserIdAndStatus, findByUserIdPaginated, update, delete, countActiveBusinesses, searchByName
- `BusinessLocation.ts` - Business location management
  - Methods: create, findById, findByBusinessId, update, delete, countByBusinessId
- `BusinessMetrics.ts` - Business metrics and KPI tracking
  - Methods: create, findById, findByBusinessId, findByLocationId, aggregateByBusinessId, aggregateByUserId, update, delete, upsert

## Seeding Data

### Business Seed Data (Task Group 2.6)
Seeds sample businesses, locations, and metrics for development:

```bash
ts-node src/database/seeds/business-seed.ts
```

This creates:
- 2 test tenant users (tenant1@test.com, tenant2@test.com)
- 8 sample businesses across different categories (F&B, Retail, Office, Healthcare, Other)
- Businesses in different statuses (active, pending_verification, stealth_mode)
- 11 business locations across various US cities
- 12 metrics entries with sample KPI data

## Database Schema

### businesses Table
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `name` (VARCHAR(255))
- `category` (VARCHAR(100))
- `status` (business_status ENUM: 'active', 'pending_verification', 'stealth_mode')
- `is_verified` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:** user_id, status, created_at

### business_locations Table
- `id` (UUID, PK)
- `business_id` (UUID, FK → businesses.id)
- `city` (VARCHAR(100))
- `state` (VARCHAR(50))
- `address` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:** business_id, city

### business_metrics Table
- `id` (UUID, PK)
- `business_id` (UUID, FK → businesses.id)
- `location_id` (UUID, FK → business_locations.id, nullable)
- `metric_date` (DATE)
- `views_count` (INTEGER, default 0)
- `clicks_count` (INTEGER, default 0)
- `property_invites_count` (INTEGER, default 0)
- `declined_count` (INTEGER, default 0)
- `messages_count` (INTEGER, default 0)
- `qfps_submitted_count` (INTEGER, default 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:** business_id, location_id, metric_date
**Unique Constraint:** (business_id, location_id, metric_date)

## Foreign Key Relationships

### Cascading Deletes
All foreign keys use `ON DELETE CASCADE`:
- Deleting a user → deletes their businesses
- Deleting a business → deletes its locations and metrics
- Deleting a location → deletes its metrics

## Testing

### Run Database Model Tests (Task Group 2.1)
```bash
npm run test src/__tests__/database/businessModels.test.ts
```

Tests cover:
- Business creation with validations
- Business-user association
- Business locations relationship
- Business metrics aggregation
- Foreign key constraint enforcement
- Status-based filtering

## Environment Variables

Required for database connection:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tenantlist_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## Notes

- All models use raw SQL with parameterized queries (no ORM)
- UUID generation uses PostgreSQL's `gen_random_uuid()`
- Timestamps auto-update using `NOW()` function
- All models accept optional Pool injection for testing
- Business status enum enforces valid status values at database level
