# Product Mission

## Pitch
DemandCRE (ZYX Platform / TenantList) is a demand-first commercial real estate marketplace that helps tenants, landlords, and brokers connect efficiently by providing intelligent matching algorithms, real-time market insights, and a transparent transaction workflow from search to signed lease.

Unlike traditional supply-first CRE platforms that force tenants to search through endless property listings, DemandCRE starts with tenant requirements and proactively matches them with optimal locations, creating a modern marketplace where demand drives discovery.

## Users

### Primary Customers

**Tenants** (Revenue Tiers: Starter Free → Enterprise $999/mo)
- Mom & Pop businesses seeking 1-2 retail/office locations
- Local brands (Panther Coffee, Pubbelly Sushi) expanding within a city
- Regional brands (Pura Vida, Chicken Kitchen, BurgerFi) managing 12-50 locations
- National brands (Nike, Starbucks, McDonalds) with unlimited location requirements

**Landlords/Developers**
- Property owners seeking qualified tenants
- Portfolio managers analyzing market demand
- Developers identifying optimal tenant mix

**Brokers**
- Tenant representation brokers sourcing properties
- Landlord brokers marketing available spaces
- Transaction coordinators managing deal flow

### User Personas

**Small Business Owner** (35-55 years)
- Role: Founder/Owner-Operator of local restaurant or retail concept
- Context: Opening first location or adding a second store
- Pain Points: Lacks CRE expertise, overwhelmed by traditional broker process, needs transparency on what spaces are actually available and affordable
- Goals: Find affordable space that matches foot traffic requirements, negotiate fair lease terms, minimize time spent searching

**Multi-Unit Franchisee** (40-60 years)
- Role: Franchise operator managing 5-15 locations for regional brand
- Context: Active expansion mode with franchise development agreements requiring new locations quarterly
- Pain Points: Manual tracking of potential sites across markets, difficulty coordinating with corporate approvals, inconsistent broker communication
- Goals: Streamline site selection process, get corporate approval on sites faster, track all deals in one system

**Corporate Real Estate Manager** (30-50 years)
- Role: Director of Real Estate for national brand with 100+ locations
- Context: Managing portfolio expansion, lease renewals, and market intelligence
- Pain Points: Cannot see competitive intelligence (where competitors are opening), lack of standardized deal tracking across markets, no centralized data on market trends
- Goals: Gain competitive intelligence on market trends, standardize site selection criteria across regions, receive early alerts on optimal properties

**CRE Broker** (28-65 years)
- Role: Commercial real estate broker representing tenants or landlords
- Context: Managing 10-30 active deals simultaneously across different clients
- Pain Points: Difficulty showcasing portfolio to potential tenants, time-intensive property tours coordination, lost deals due to slow communication
- Goals: Increase deal velocity, access qualified tenant leads, streamline transaction documentation

## The Problem

### CRE is Supply-First, Not Demand-First
Traditional commercial real estate platforms (LoopNet, CoStar) are built for landlords to list properties. Tenants must reactively search through thousands of listings, most of which don't match their criteria. This results in wasted time, missed opportunities, and information asymmetry favoring landlords.

**Our Solution:** We flip the model. Tenants publish their requirements first (QFPs - Qualified Facility Profile), and our matching algorithms proactively surface optimal properties. Landlords gain visibility into real demand before spaces hit the market.

### Fragmented Deal Management
Tenants managing multi-site rollouts use spreadsheets, email threads, and disparate tools to track tours, negotiations, and lease documents across markets. This creates coordination failures, missed deadlines, and lost institutional knowledge.

**Our Solution:** Unified deal pipeline (Kanban view) from initial search through signed lease. Calendar syncing for tours, document vault for LOIs/leases, real-time messaging with all stakeholders, and audit logs for compliance.

### Lack of Market Intelligence
Tenants cannot access the demand data that landlords and brokers use to price spaces. They don't know what competitors are paying, where foot traffic is trending, or which neighborhoods have optimal demographics for their concept.

**Our Solution:** Transparent market insights including vacancy trends, absorption rates, demographic heatmaps, competitor density analysis, and demand scoring. Data democratization levels the playing field.

### High Friction for Small Operators
Mom & Pop businesses and emerging brands cannot afford traditional broker fees or navigate complex CRE processes. They are often ignored by institutional brokers focused on large deals.

**Our Solution:** Free Starter tier provides basic matching and direct messaging, allowing small operators to self-serve. As they grow (Pro/Premium tiers), they unlock broker collaboration and advanced features.

## Differentiators

### Demand-First Marketplace
Unlike LoopNet/CoStar (supply-first listing aggregators), we prioritize tenant demand profiles. Landlords see qualified tenant requirements before properties are listed, enabling proactive deal origination and reducing time-to-lease.

### Intelligent Matching Algorithms
We build proprietary matching algorithms (not rented from Databricks) that score tenant-property fit based on demographics, foot traffic, drive-time analysis, competitor proximity, and lease economics. This delivers precision recommendations that generic search filters cannot match.

### Transparent Pricing Tiers
Clear monetization with 4 tiers (Starter Free, Pro $99, Premium $199, Enterprise $999) aligned to user size (Mom & Pop → National Brands). Unlike enterprise-only CRE tools, we serve the full spectrum from self-service to white-glove support.

### Data Ownership Strategy
We own core IP including matching algorithms, visualization code (D3.js/Recharts), and NLP interfaces (building custom Text-to-SQL). We strategically use third-party APIs (UpLead, Mapbox) only where rebuild costs exceed licensing costs, then aggressively cache/harvest data to minimize vendor lock-in.

### Unified Transaction Workflow
End-to-end deal management from search → tour → offer → signed lease. Integrated document signing (DocuSign API), real-time chat (Stream), calendar syncing, and compliance audit logs. Competitors offer point solutions; we offer the full stack.

## Key Features

### Core Features (All Tiers)
- **Smart Matching Engine:** Receive proactive property recommendations based on your QFP (Qualified Facility Profile) criteria rather than manually searching listings
- **Role-Based Dashboards:** Tenant, Landlord, and Broker users see customized views optimized for their workflow and decision-making needs
- **Direct Messaging:** Real-time chat with brokers, landlords, or team members to accelerate deal velocity and reduce email friction
- **Document Center:** Centralized vault to receive and download property brochures, floorplans, and deal documents
- **Basic Market Insights:** Access demand data trends by asset type, industry, and state to understand macro market conditions

### Collaboration Features (Pro/Premium/Enterprise)
- **Team Hierarchy & Permissions:** Multi-layer org structures (Admin > Manager > Collaborator) with approval workflows for location publishing and QFP sends
- **Kanban Deal Pipeline:** Visual board to drag-and-drop deals through stages (To Tour → Offer → Signed) with multi-site rollout master views
- **Broker Collaboration:** Invite brokers per listing with role-based access to property details and negotiation threads
- **Calendar Syncing:** Sync tour dates with Outlook/Google calendars and view team availability to eliminate scheduling conflicts
- **Saved Searches:** Auto-notify when new properties match your criteria so you never miss optimal listings

### Advanced Features (Premium/Enterprise)
- **AI Scoring & Demographics:** Rank properties by "Best Fit" using ML algorithms analyzing foot traffic, competitor density, and demographics
- **Drive-Time Analysis:** Mapbox isochrone tools to visualize 10/20/30-minute commute zones and nearby amenities
- **Heatmaps & Competitive Intelligence:** Overlay competitor locations, foot traffic density, and demand trends on interactive maps
- **Anonymous/Stealth Mode:** Search and tour properties without revealing corporate identity to prevent competitive signaling
- **Contact Unlocking:** Access decision-maker emails and phone numbers (CEO/CFO) for direct outreach using UpLead integration
- **Video Profiles:** Embed 15-second property videos into listings to showcase spaces dynamically
- **Lease Expiry Alerts:** Receive critical date notifications for lease renewals and expiration options
- **Audit Logs:** Message history and transaction records archived permanently for compliance and dispute resolution
- **Dedicated Support Agent:** White-glove account management for Enterprise tier clients

### Enterprise-Only Features
- **Unlimited Locations:** No cap on property listings or tenant requirement profiles
- **3-Layer Hierarchy:** Admin > Manager > Collaborator with granular permission controls
- **Competitor Location Metrics:** One-time unlock to view analytics on competitor properties (traffic, sales estimates)
- **Page View Tracking:** See which landlords/brokers view your profile and click through to your property list
- **Multi-Listing Comparison:** Compare up to 3 properties side-by-side with detailed analytics

## Success Metrics

### User Acquisition
- Monthly Active Users (MAU) by tier: Starter, Pro, Premium, Enterprise
- User role distribution: 40% Tenants, 35% Brokers, 25% Landlords
- Conversion rate: Free Starter → Paid Pro (target: 8-12%)

### Engagement
- Average properties matched per tenant QFP (target: 15+ matches)
- Message response rate between tenants and brokers (target: 65%+ within 24h)
- Deal pipeline progression: % of deals moving from Tour → Offer → Signed (target: 25% conversion)

### Revenue
- Monthly Recurring Revenue (MRR) by tier
- Average Revenue Per User (ARPU): Target $150-200 blended
- Customer Acquisition Cost (CAC) payback period: <6 months
- Churn rate by tier: Starter (exempt), Pro (<15%), Premium (<10%), Enterprise (<5%)

### Product Quality
- Match accuracy score: User feedback on property recommendation relevance (target: 4.2+/5)
- Time-to-first-match: Hours from QFP submission to first property recommendation (target: <2 hours)
- Document upload success rate (target: 98%+)
- API uptime for integrations (UpLead, DocuSign, Stream): 99.5%+

### Market Intelligence
- Data coverage: % of commercial properties in target markets with demand scores (target: 70%+ in top 20 metro areas)
- Demand trend accuracy: Correlation between platform demand indicators and actual market absorption rates
- Competitive intelligence depth: Average # of competitor locations mapped per user (target: 8+ for Premium/Enterprise)

### Strategic Goals
- Own core IP: Matching algorithm codebase, visualization library, Text-to-SQL NLP agent
- Cost optimization: Reduce per-user infrastructure cost by 30% through caching (UpLead contacts), self-hosting (PostHog vs FullStory), and migration (Auth0 → SuperTokens)
- Enterprise penetration: 50+ national brand clients by Year 2
- Geographic expansion: Launch in top 10 US metro markets in Year 1, expand to 25 markets by Year 2
