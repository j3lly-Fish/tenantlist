# Tech Stack

## Current Stack (MVP - In Production)

### Backend
- **Runtime:** Node.js (LTS)
- **Language:** TypeScript
- **Framework:** Express.js 5.x
- **Architecture:** RESTful API

### Database & Storage
- **Primary Database:** PostgreSQL 14+
- **Database Driver:** pg (raw SQL, no ORM)
- **Cache/Session Store:** Redis 6+
- **File Storage:** AWS S3 (profile photos, documents)
- **Migration Framework:** Custom TypeScript migration runner with up/down support

### Authentication & Security
- **Authentication:** JWT with refresh tokens
- **Password Hashing:** bcrypt
- **OAuth Providers:** Google, Facebook, Twitter (infrastructure built)
- **Session Management:** Redis-backed refresh tokens
- **MFA:** Infrastructure built (Speakeasy library), disabled for MVP
- **CSRF Protection:** Custom middleware
- **Rate Limiting:** IP-based and email-based via Redis
- **HTTPS Enforcement:** Middleware + Nginx reverse proxy

### Testing
- **Test Framework:** Jest
- **TypeScript Testing:** ts-jest
- **Component Testing:** @testing-library/react (for frontend)
- **API Testing:** Supertest
- **Test Environment:** Dedicated PostgreSQL test database

### DevOps & Deployment
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **Environment Management:** dotenv
- **Process Management:** (TBD: PM2 or systemd for production)

### Frontend (Initial Setup)
- **UI Library:** React 18.x
- **Language:** TypeScript
- **Build Tool:** (TBD: Vite or Webpack)
- **Component Testing:** @testing-library/react, @testing-library/jest-dom

### Utilities
- **Phone Validation:** libphonenumber-js
- **Image Processing:** Sharp (for photo resizing/optimization)
- **File Upload:** Multer
- **UUID Generation:** uuid library

## Planned Integrations (By Phase)

### Phase 1: MVP Foundation (Months 1-3)

**Payment Processing**
- **Stripe Connect:** Subscription management for Pro/Pro/Premium/Enterprise tiers
- Cost: 2.9% + $0.30 per transaction
- Usage: Process monthly SaaS subscriptions, no rent collection

**Email Delivery**
- **SendGrid:** Transactional emails (notifications, alerts, password resets)
- Cost: ~$100/mo (Pro Plan)
- Usage: Match alerts, message notifications, tour reminders

**Real-Time Messaging**
- **Stream:** In-app chat for MVP
- Cost: ~$499/mo (Standard Plan)
- Usage: 1-on-1 and group messaging between tenants, brokers, landlords
- Migration Path: Replace with Socket.io in Optimization Phase (Months 13-18)

**Authentication (Current)**
- **Auth0:** OAuth, SSO, and identity management
- Cost: Free up to 7k MAU, then ~$23/user/mo
- Strategic Note: Monitor MAU closely; migrate to SuperTokens if costs spike
- Migration Path: Planned in Optimization Phase (Months 13-18)

**Identity Verification**
- **Persona:** ID scanning for verified badges and fraud prevention
- Cost: ~$1.50 per verification check
- Usage: Verify new tenant identities (Premium+ feature)

### Phase 2: Collaboration Features (Months 4-6)

**Calendar Integration**
- **Google Calendar API:** Sync tour dates and team availability
- **Microsoft Graph API:** Outlook calendar integration
- Cost: Free (API usage within quotas)
- Usage: Tour scheduling, lease expiry alerts

**Document Storage**
- **AWS S3:** Expanded usage for document vault (LOIs, leases, brochures)
- Cost: Pay-as-you-go storage + transfer
- Usage: Collaborative document uploads, version history, permanent lease storage

### Phase 3: Intelligence & Data (Months 7-9)

**Data Ingestion**
- **Snowflake:** Data port to receive vendor feeds (Deep Sync, Placer.ai)
- Cost: Consumption-based (~$500-2k/mo estimated)
- Usage: Staging area for raw data feeds; sync cleaned data to PostgreSQL
- Strategic Note: Do NOT query Snowflake directly from app (too slow/expensive)

**Map & Location Intelligence**
- **Mapbox:** Interactive maps, drive-time isochrones, amenities layer
- Cost: Pay-per-load (usage-based)
- Usage: Property pins, radius tool (10/20/30-min drive-time polygons), heatmaps
- Strategic Note: Essential for isochrone math; consider MapLibre for basic tiles to reduce costs

**Visualization (Own the Code)**
- **D3.js or Recharts:** Custom charts and heatmaps
- Cost: Free (open-source libraries)
- Usage: Market insights dashboards, demand heatmaps, competitive intelligence overlays
- Strategic Note: Build proprietary visualizations; do NOT use Tako or other vendor-locked tools

**Contact Data**
- **UpLead:** Decision-maker contact unlocking (CEO/CFO emails/phones)
- Cost: ~$500-1,500/mo (Starter to Growth tiers)
- Usage: Reveal contacts when brokers view stealth tenants
- Strategic Note: Aggressively cache unlocked contacts in PostgreSQL; build scraper to replace long-term (Optimization Phase)

**NLP Interface (MVP)**
- **Julius.ai:** Natural language "Ask an Analyst" for Enterprise users
- Cost: Consumption-based (~$2,500/mo estimated)
- Usage: Text-to-SQL queries ("Show me retail vacancy in Brickell")
- Migration Path: Build custom Text-to-SQL agent in Optimization Phase (Months 13-18)

**Risk & Trust Data**
- **Censai:** Tenant success probability risk scoring
- Cost: Custom data feed (pricing TBD)
- Usage: Display risk scores on tenant profiles for landlord review

- **EDGAR (SEC):** Financial health data for public companies
- Cost: Free (government database)
- Usage: Auto-embed 10-K/10-Q filings on national brand profiles

- **FranData:** Franchise operator validation badges
- Cost: Custom data feed (~$1k+/mo estimated)
- Usage: Display "Multi-Unit Operator" badges on franchisee profiles

- **BBB (Better Business Bureau):** Trust verification for small businesses
- Cost: API per-check fee (small)
- Usage: Display BBB Accredited logos on Mom & Pop tenant profiles

### Phase 4: Scale Features (Months 10-12)

**Document Signing**
- **DocuSign API:** In-platform LOI and lease signing
- Cost: ~$300/mo+ (API pricing)
- Usage: Legal signature workflows, track signature status, store executed docs

**Video Processing**
- **AWS S3 + AWS Elemental MediaConvert (or similar):** Video upload and transcoding
- Cost: Pay-per-use transcoding
- Usage: 15-second profile videos for Premium+ tenants
- Alternative: FFmpeg self-hosted for cost savings

**Product Analytics (Current MVP)**
- **FullStory (Consider):** Session recording and conversion intelligence
- Cost: ~$800-1,200/mo (Business plan)
- Usage: UX debugging, lost revenue funnel analysis
- Migration Path: Replace with self-hosted PostHog in Optimization Phase

**Product Guidance**
- **Pendo (Consider):** Product intelligence, in-app guides, user feedback
- Cost: ~$3,000/mo
- Usage: Feature adoption tracking, onboarding flows, user feedback collection
- Strategic Note: If purchasing Pendo, use heavily to justify cost; can replace FullStory + basic analytics
- Alternative: PostHog (analytics) + Driver.js (in-app guides) for cheaper stack

### Phase 5: Optimization (Months 13-18)

**Self-Hosted Analytics**
- **PostHog (Open Source):** Replace FullStory for session recording and funnels
- Cost: Infrastructure only (self-hosted on VPS or AWS)
- Usage: User behavior analytics, conversion tracking, feature flags
- Strategic Note: Eliminates per-session costs, retains data ownership

**Custom Text-to-SQL**
- **Build In-House:** LLM fine-tuned on CRE terminology → SQL query generation
- Cost: LLM API costs (OpenAI/Anthropic) + development time
- Usage: Replace Julius.ai for Enterprise "Ask an Analyst" feature
- Strategic Note: Own the IP, improve accuracy on domain-specific queries

**Self-Hosted Chat**
- **Socket.io:** Replace Stream for real-time messaging
- Cost: Infrastructure only (Node.js server + Redis for pub/sub)
- Usage: In-app chat with message persistence, read receipts, typing indicators
- Strategic Note: Eliminate $499/mo Stream cost at scale; do after proving PMF

**Contact Harvesting**
- **Custom Web Scraper:** Build internal database of CRE decision-maker contacts
- Cost: Development time + proxy/scraping infrastructure
- Usage: Replace UpLead API to minimize per-contact costs
- Strategic Note: Requires legal review for compliance (GDPR, CAN-SPAM)

**Authentication Migration**
- **SuperTokens (Open Source):** Replace Auth0 to eliminate per-MAU costs
- Cost: Infrastructure only (self-hosted)
- Usage: OAuth, session management, email/password auth
- Strategic Note: Migrate when MAU costs become significant; plan zero-downtime migration

**Internal Dashboards**
- **Streamlit (Python):** Replace Hex.Tech for data team prototyping
- Cost: Free (self-hosted)
- Usage: Internal market trend visualization, quality control dashboards

**Self-Service Reporting**
- **Apache Superset (Open Source):** Embed for Pro/Premium users
- Cost: Free (self-hosted)
- Usage: Custom portfolio reports, drag-and-drop metrics
- Strategic Note: Reserve ThoughtSpot ($40-100+/user) for Enterprise tier only

**Document AI**
- **Google Cloud Document AI:** Auto-extract fields from uploaded rent rolls/LOIs
- Cost: ~$65/1k pages processed
- Usage: Eliminate manual data entry by parsing PDF documents

### Phase 6: Enterprise Features (Months 19-24)

**Market Data Feeds**
- **Deep Sync:** Commercial property data feed
- Cost: Custom (negotiated)
- Usage: Property listings, ownership records, transaction history

- **Placer.ai:** Foot traffic and visitor analytics
- Cost: Custom (negotiated)
- Usage: Competitor density analysis, foot traffic heatmaps, demographic insights

**Advanced Analytics**
- **ThoughtSpot:** Self-service BI for Enterprise tier only
- Cost: ~$40-100+/user (token/tier-based)
- Usage: Ad-hoc portfolio reporting, custom dashboard creation
- Strategic Note: Expensive; reserve strictly for Enterprise customers

**Backend Automation**
- **CrewAI:** AI agent orchestration for background tasks
- Cost: ~$74-299/mo (credit-based)
- Usage: Web scraping, email drafting, automated market report generation
- Strategic Note: Use selectively; evaluate vs. building custom agents

**Marketing Assets**
- **Flourish:** Animated chart creation for social media marketing
- Cost: ~$70-500/mo (Business to Team)
- Usage: LinkedIn/Twitter marketing content (not in-app)

**Research Operations**
- **NotebookLLM:** Internal research tool for unstructured data insights
- Cost: ~$20-50/user
- Usage: Internal team only; analyze vendor reports, market research

## Build vs. Buy Decisions

### Build (Own the IP)
- Matching algorithms (Python + PostGIS, not Databricks)
- Visualization code (D3.js/Recharts, not Tako)
- Text-to-SQL NLP agent (replace Julius.ai)
- Chat server (Socket.io, replace Stream)
- Contact database (scraper, replace UpLead)
- Internal dashboards (Streamlit, replace Hex.Tech)
- Self-service reporting (Superset for Pro/Premium)

### Buy (License/API)
- Payment processing (Stripe Connect) - core competency not worth building
- Email delivery (SendGrid) - deliverability infrastructure too complex
- Maps (Mapbox) - isochrone math and geospatial tooling expensive to build
- Document signing (DocuSign) - legal compliance and e-signature standards
- Identity verification (Persona) - ID scanning and fraud detection expertise
- Risk data (Censai, FranData, BBB, EDGAR) - proprietary datasets
- Market data (Deep Sync, Placer.ai) - data acquisition and licensing

### Rent Then Build (Start with API, Migrate Later)
- Chat (Stream → Socket.io after PMF)
- Auth (Auth0 → SuperTokens at scale)
- Analytics (FullStory → PostHog after validation)
- NLP (Julius.ai → Custom Text-to-SQL for accuracy)
- Contacts (UpLead → Custom scraper for cost savings)

## Infrastructure Architecture

### Current Setup
```
Nginx (Reverse Proxy)
  ↓
Express.js API (Node.js/TypeScript)
  ↓
PostgreSQL 14+ (Primary Database)
  ↓
Redis 6+ (Cache/Sessions)
  ↓
AWS S3 (File Storage)
```

### Target Production Architecture (Phase 2+)
```
Cloudflare (CDN/DDoS Protection)
  ↓
Load Balancer (AWS ALB or DigitalOcean)
  ↓
Nginx (Reverse Proxy) × N instances
  ↓
Express.js API Cluster (Horizontal scaling)
  ↓
PostgreSQL Primary + Read Replicas (High availability)
  ↓
Redis Cluster (Session store, caching, pub/sub)
  ↓
AWS S3 (Documents/Photos) + CloudFront (CDN)
  ↓
Socket.io Server (Self-hosted chat)
  ↓
PostHog (Self-hosted analytics)
```

## Cost Optimization Strategy

### Phase 1: Accept Vendor Costs (MVP)
- Use Stream, Auth0, FullStory, UpLead to move fast
- Monitor costs closely, set budget alerts

### Phase 2: Aggressive Caching
- Cache UpLead contacts forever in PostgreSQL
- Cache Mapbox tiles and isochrone results where possible
- Cache Placer.ai foot traffic data (refresh weekly)

### Phase 3: Migrate High-Volume Services
- Replace Stream with Socket.io (save $499/mo)
- Replace FullStory with PostHog (save $800+/mo)
- Replace Auth0 with SuperTokens when MAU >10k (save $230+/mo)

### Phase 4: Build Core IP
- Own matching algorithm codebase
- Own visualization library (D3.js/Recharts)
- Own Text-to-SQL agent (reduce Julius.ai dependency)
- Build contact harvester (reduce UpLead dependency)

### Phase 5: Negotiate Enterprise Contracts
- Volume pricing for Snowflake as data scales
- Custom contracts with Deep Sync, Placer.ai, FranData
- Partner with Mapbox for enterprise tier (negotiate fixed pricing)

## Technology Principles

1. **Own Core Differentiators:** Matching algorithms, visualizations, NLP interfaces are proprietary assets. Build in-house.

2. **Rent Commodities:** Payment processing, email delivery, document signing are utilities. Use best-in-class APIs.

3. **Rent Then Build:** Start with vendors for speed (Stream, Auth0, Julius.ai). Migrate to self-hosted as scale justifies investment.

4. **Data Ownership:** Store all unlocked contacts, cached market data, and user analytics in PostgreSQL. Never rely solely on vendor APIs for critical data.

5. **Cost Per User Vigilance:** Monitor per-MAU (Auth0), per-session (FullStory), per-contact (UpLead) costs. Migrate before "success tax" becomes unsustainable.

6. **Open Source First:** Prefer open-source alternatives (PostHog, SuperTokens, Superset, Socket.io) over SaaS when self-hosting is feasible.

7. **Postgres-First Architecture:** Use PostgreSQL as source of truth. Redis for ephemeral cache/sessions only. No distributed databases until scale demands it (>1M users).

8. **Test Minimally, Deploy Rapidly:** 6-8 focused tests per feature on critical paths. No edge case testing until dedicated QA phase. Ship fast, iterate based on user feedback.
