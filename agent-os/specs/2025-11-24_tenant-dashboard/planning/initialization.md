# Spec Initialization: Tenant Dashboard

## Feature Description
The user wants to build out the tenant dashboard for DemandCRE.

## Context
DemandCRE is a commercial real estate marketplace with:
- **User roles**: tenant, landlord, broker
- **Pricing tiers**: Starter (Free), Pro ($99/mo), Premium ($199/mo), Enterprise ($999/mo)
- **Tech stack**: Node.js/TypeScript, Express.js, PostgreSQL, Redis, JWT auth
- **Completed work**: User authentication, role-based routing, OAuth, MFA infrastructure

From the product documentation (roadmap.md), the tenant dashboard should include features based on pricing tier:

**Starter Tier (Free)**:
- Basic Match % scores
- Send QFPs (Qualified Facility Proposal)
- Simple favorites list (List View)
- Personal calendar for tour dates
- Basic filters (Price, Size, Type)
- Simple map pins
- User bio/contact info
- Direct messaging with listing agent
- Receive documents (brochures/floorplans)

**Pro Tier ($99/mo)**:
- View broker/tenant contact info
- See property analytics (Pro level)
- Board View Kanban (drag-and-drop: To Tour → Offer → Signed)
- Team Sync calendar (Outlook/Google + Team availability)
- Saved searches with auto-notify
- Radius Tool (drive-time analysis & amenities)
- Company Card (brand logo & requirement summary)
- Group threads (include broker/partners in chats)
- Collaborate on docs (upload LOIs, redline versions)

**Premium Tier ($199/mo)**:
- See property analytics (Premium level)
- 15-second video uploads to profile
- Receive property matches 1 week earlier
- Multi-Site Rollout view (50+ active locations)
- Critical Dates alerts (Lease Expiry & Renewal Options)
- AI Scoring (rank sites by "Best Fit" & Demographics)
- Heatmaps (competitor density & foot traffic layers)
- Anonymous Mode (hide identity during search)
- Audit Logs (message history for compliance)
- Lease Admin (abstracted lease data permanently stored)

**Enterprise Tier ($999/mo)**:
- Stealth Mode
- Review similar properties (3)
- Dedicated support agent
- Compare 3 listings at a time
- Unlock competitor location metrics (1 time)
- Page view tracking with profile visibility
- Demand data (asset > industry > state > county > city > zip > sqft)

## Date Initialized
2025-11-24
