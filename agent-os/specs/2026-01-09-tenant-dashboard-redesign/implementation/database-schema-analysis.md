# Database Schema Analysis - Task Group 2.2

## Current User-Business Relationship Structure

### Existing Schema
The current database schema already supports multiple businesses per user through a **one-to-many relationship**:

#### businesses table (from migration 008-create-businesses-table.ts)
```sql
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  status business_status NOT NULL DEFAULT 'pending_verification',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  stealth_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_businesses_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
```

**Indexes:**
- `idx_businesses_user_id` ON businesses(user_id)
- `idx_businesses_status` ON businesses(status)
- `idx_businesses_user_status` ON businesses(user_id, status, created_at)
- `idx_businesses_created_at` ON businesses(created_at)

#### user_profiles table (from migration 003-create-user-profiles-table.ts)
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  bio TEXT,
  phone VARCHAR(20) NOT NULL,
  photo_url VARCHAR(500),
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_profiles_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
```

**Note:** There is NO `business_id` field in the user_profiles table.

## Analysis Results

### Relationship Structure
- **Current Implementation:** One-to-Many (User → Businesses)
  - One user can have many businesses
  - Each business belongs to exactly one user (creator)
  - Relationship established through `businesses.user_id` foreign key

### Multiple Businesses Per User Support
✅ **Already Supported**
- The existing schema fully supports multiple businesses per user
- A user can create unlimited businesses (each with `user_id` pointing to the user)
- Query: `SELECT * FROM businesses WHERE user_id = $1` returns all businesses for a user

### Junction Table Assessment
❌ **NOT NEEDED**
- A junction table (user_businesses) would be necessary only if:
  - Multiple users could "own" or be associated with the same business instance
  - We need to track different roles for users within a business
  - We need many-to-many relationships

- Current requirements only need:
  - Users to create their own businesses
  - Users to link their profile to existing businesses (by creating their own instance)
  - Tracking which businesses a user has created/owns

**Conclusion:** The current one-to-many relationship via `businesses.user_id` is sufficient for all requirements in this spec.

## Database Enhancements Implemented

### Task 2.4: New Search Indexes (Migration 032)
Added the following indexes for global business search optimization:

```sql
-- Case-insensitive ILIKE search
CREATE INDEX idx_businesses_name_lower ON businesses(LOWER(name));

-- Full-text search
CREATE INDEX idx_businesses_name_tsvector
  ON businesses USING gin(to_tsvector('english', name));

-- Composite index for user + name search
CREATE INDEX idx_businesses_user_name
  ON businesses(user_id, LOWER(name));
```

### Task 2.5: New Business Model Methods

#### findAllGlobal(searchTerm)
- Global search across ALL businesses (not filtered by user_id)
- Uses ILIKE for case-insensitive pattern matching
- Orders by verification status and creation date
- Limits to 50 results

#### checkDuplicate(companyName)
- Case-insensitive exact match to detect duplicate business names
- Returns boolean indicating if business exists
- Prevents duplicate business creation

#### findByUserId(userId)
- Already existed - returns all businesses for a specific user
- Orders by created_at DESC
- Used for business count calculation

## User Flow: Adding Existing Business

When a user selects an existing business from the global search:

**Current Schema Approach:**
Since businesses have a single owner (user_id), when a user "adds" an existing business to their portfolio, we have two options:

### Option A: Create a Junction Table (Not Implemented)
Create `user_businesses` table to track which users are associated with which businesses:
```sql
CREATE TABLE user_businesses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  role VARCHAR(50), -- 'owner', 'member', etc.
  added_at TIMESTAMP,
  UNIQUE(user_id, business_id)
);
```

### Option B: Business Instances (Recommended)
Each user creates their own "instance" or "copy" of business profile data:
- User searches for "Starbucks"
- Finds existing business with name "Starbucks"
- System pre-fills business creation form with existing data
- User creates their own business record (new row in businesses table)
- New business record has their user_id

**Recommendation:** Option B aligns with current schema and maintains data ownership model where each user owns their business profiles.

## Schema Summary

| Aspect | Status |
|--------|--------|
| Multiple businesses per user | ✅ Supported (via businesses.user_id) |
| Global business search | ✅ Implemented (findAllGlobal method) |
| Duplicate detection | ✅ Implemented (checkDuplicate method) |
| Search optimization indexes | ✅ Added (migration 032) |
| Junction table needed | ❌ Not required for current spec |
| Business count for user | ✅ Supported (findByUserId.length) |

## Next Steps (Task Group 3)

The database layer is ready for Task Group 3: API Endpoints and Controllers
- Implement GET /api/businesses/search endpoint (uses findAllGlobal)
- Implement POST /api/businesses/check-duplicate endpoint (uses checkDuplicate)
- Implement GET /api/user/businesses endpoint (uses findByUserId)
- No user_businesses table needed - use existing businesses table with user_id
