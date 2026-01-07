# Product Roadmap

## Foundation Phase (MVP - Months 1-3)

1. [ ] **Tenant Profile & QFP Creation** — Build complete tenant onboarding flow where users create profiles and submit Qualified Facility Profiles (QFPs) with requirements (location, sqft, budget, asset type). Includes form validation, photo upload, and bio fields. `M`

2. [ ] **Property Listing System** — Enable landlords and brokers to create property listings with details (address, sqft, price, photos, amenities). Includes document upload for brochures/floorplans and basic search functionality. `M`

3. [ ] **Basic Matching Algorithm (v1)** — Implement rule-based matching engine that scores tenant QFPs against property listings using filters (price range, sqft, location radius, asset type). Store match scores in database and display top 10 recommendations per tenant. Display "N/A" for match percentages until algorithm is fully built. `L`

4. [ ] **Direct Messaging System** — Build simple internal messaging system for 1-on-1 chat between tenants, brokers, and landlords. Includes message history, read receipts, and basic notifications. No external API dependencies (NOT Stream API). `M`

5. [x] **Role-Based Dashboard Views** — Create three distinct dashboard layouts (Tenant, Landlord, Broker) with role-specific features, navigation, and data displays. Implement dashboard routing based on user_role from authentication. `S` *(Tenant Dashboard and Broker Dashboard complete; Landlord dashboard pending)*

6. [ ] **Subscription & Payment Processing** — Integrate Stripe Connect for Starter (Free), Pro ($99), Premium ($199), and Enterprise ($999) tier subscriptions. Implement billing logic, payment webhooks, and subscription status checks that gate features. `M`

7. [ ] **Email Notification System** — Set up SendGrid integration for transactional emails including new match alerts, message notifications, tour reminders, and account updates. Build email templates and queueing system. `S`

8. [ ] **Basic Market Insights Dashboard** — Display aggregate demand data (vacancy rates, absorption trends) by asset type, industry, and state. Pull data from Snowflake staging and render charts using D3.js or Recharts. Available to all tiers. `M`

## Collaboration Phase (Months 4-6)

9. [ ] **Team Hierarchy & Permissions** — Implement multi-layer org structures (Admin > Manager > Collaborator) with invitation system, role assignments, and permission checks. Build approval workflows for Yellow/Red Light tiers (QFP sends, location publishing). `L`

10. [ ] **Kanban Deal Pipeline** — Create visual board (List View for Starter, Board View for Pro+) to track deals through stages: Favorites → To Tour → Offer → Signed. Implement drag-and-drop, status updates, and multi-site rollout master views (Premium+). `M`

11. [ ] **Calendar Integration** — Build calendar system for tour scheduling with Outlook/Google calendar sync. Display team availability, send reminders, and track critical dates (lease expiry, renewal options for Premium+). `M`

12. [ ] **Document Vault (Collaborate Mode)** — Upgrade Document Center from receive-only to collaborative mode. Enable tenants/brokers to upload LOIs, redline documents, and manage version history. Premium+ includes lease abstraction and permanent storage. `M`

13. [ ] **Broker Per Listing** — Allow tenants to invite specific brokers to collaborate on individual listings. Brokers gain scoped access to property details, can message all stakeholders, and track commission splits. `S`

14. [ ] **Group Messaging Threads** — Extend messaging to support multi-party conversations (tenant + broker + landlord). Includes participant management, thread archiving, and audit logs for Enterprise tier. `S`

## Intelligence Phase (Months 7-9)

15. [ ] **Advanced Matching Algorithm (v2)** — Upgrade matching engine with ML scoring using demographics, foot traffic (Placer.ai data), competitor proximity, and historical deal success rates. Train model on completed transactions. Own the algorithm codebase (Python + PostGIS). `XL`

16. [ ] **Map Visualization with Pins & Radius** — Integrate Mapbox to display property pins on interactive map. Implement radius tool for drive-time analysis (10/20/30-min isochrones) and amenities layer. Available Pro+. `M`

17. [ ] **Heatmap Overlays** — Build heatmap visualizations for competitor density, foot traffic patterns, and demand trends. Layer data from Placer.ai and internal demand database. Premium+ feature using D3.js/Recharts (own the code). `L`

18. [ ] **Saved Searches & Auto-Alerts** — Allow users to save search criteria and receive automatic email/in-app notifications when new properties match their filters. Includes search history and edit functionality. Pro+ feature. `S`

19. [ ] **Contact Unlocking (UpLead)** — Integrate UpLead API to reveal decision-maker contact info (CEO/CFO email/phone) when brokers view stealth tenants or tenants unlock landlord contacts. Cache contacts aggressively to minimize API costs. Premium+ feature. `M`

20. [ ] **Anonymous/Stealth Mode** — Enable Premium+ users to browse properties and submit QFPs without revealing corporate identity. Display as "Confidential Retail Operator" with partial requirements visible to landlords until reveal. `S`

21. [ ] **AI-Powered Text-to-SQL Interface (MVP)** — Integrate Julius.ai for Enterprise users to ask natural language questions ("Show me retail vacancy in Brickell") and receive data answers. Build for MVP; plan to replace with custom agent long-term. `M`

## Scale Phase (Months 10-12)

22. [ ] **Multi-Listing Comparison Tool** — Build side-by-side comparison view for 2 properties (Premium) or 3 properties (Enterprise) with detailed analytics, scoring breakdowns, and demographic overlays. `M`

23. [ ] **Risk Scoring & Trust Badges** — Integrate Censai for tenant success probability scores, EDGAR API for 10-K/10-Q financial widgets (public companies), FranData for multi-unit operator badges, and BBB API for accreditation logos. Display on tenant profiles. `L`

24. [ ] **Video Profile Uploads** — Enable Premium+ tenants to embed 15-second video clips into profiles. Implement video upload to AWS S3, transcoding, and playback controls. `S`

25. [ ] **DocuSign Integration** — Connect DocuSign API to allow in-platform LOI and lease signing. Track signature status, send reminders, and store executed documents in Document Vault. `M`

26. [ ] **Page View Tracking & Analytics** — Implement view tracking so Pro/Premium users see who viewed their profile/properties (anonymous for Starter, aggregated for Pro, detailed for Premium+). Build analytics dashboard with conversion funnels. `M`

27. [ ] **Notification Preferences & Alerts** — Build granular notification settings (email, in-app, SMS) for match alerts, messages, tour reminders, lease expiry warnings, and page views. Includes do-not-disturb schedules. `S`

28. [ ] **Dedicated Support Agent Portal** — Create internal CRM-style portal for Enterprise support agents to view customer accounts, track tickets, access audit logs, and manage white-glove requests. `M`

## Optimization Phase (Months 13-18)

29. [ ] **Custom Text-to-SQL Agent** — Replace Julius.ai with proprietary NLP agent that converts natural language to SQL queries against our PostgreSQL database. Use LLM fine-tuning on CRE terminology. Reduces vendor costs and improves accuracy. `XL`

30. [ ] **Self-Hosted Analytics (PostHog)** — Migrate from FullStory to self-hosted PostHog for session recording, conversion funnels, and user analytics. Reduces per-session costs and retains data ownership. `M`

31. [ ] **Socket.io Chat Migration** — Replace Stream API with self-hosted Socket.io chat server to eliminate $499/mo cost at scale. Requires building message persistence, read receipts, and typing indicators. Do after proving product-market fit. `L`

32. [ ] **Contact Harvesting System** — Build web scraper to harvest CRE decision-maker contacts (CEO/CFO emails) and store in internal database. Reduces dependency on UpLead API costs. Requires legal review for compliance. `L`

33. [ ] **Auth0 → SuperTokens Migration** — Migrate authentication from Auth0 to open-source SuperTokens to eliminate per-MAU costs as platform scales. Plan migration path with zero downtime and session preservation. `M`

34. [ ] **Internal Market Insights Dashboard (Hex.Tech Alternative)** — Build Streamlit-based internal dashboards for data team to prototype market trends and quality-control visualizations before productizing. Free alternative to Hex.Tech. `S`

35. [ ] **Apache Superset Report Builder** — Embed open-source Apache Superset for Pro/Premium tiers to build custom portfolio reports. Enterprise tier gets ThoughtSpot for advanced self-service analytics. `M`

36. [ ] **Document AI Extraction** — Integrate Google Cloud Document AI to auto-extract fields (rent, sqft, lease terms) from uploaded rent rolls and LOIs. Pre-populate listing forms to eliminate manual data entry. `M`

## Enterprise Phase (Months 19-24)

37. [ ] **Competitor Location Metrics Unlock** — Build feature allowing Enterprise users to pay one-time fee to unlock analytics on specific competitor properties (estimated traffic, sales, tenant mix). Data sourced from Placer.ai and public records. `M`

38. [ ] **Portfolio Performance Analytics** — Create enterprise dashboard showing aggregate metrics across all locations: occupancy rates, lease expiry calendar, renewal probability scores, and market share by MSA. `L`

39. [ ] **API Access for Enterprise Clients** — Build RESTful API allowing Enterprise customers to programmatically access property data, submit QFPs, and pull match results into their internal systems. Includes API keys, rate limiting, and webhook support. `L`

40. [ ] **White-Label Partner Program** — Enable franchisors and national brands to white-label DemandCRE for their franchisees. Includes custom branding, SSO integration, and centralized admin controls. `XL`

41. [ ] **Lease Renewal Intelligence** — Build ML model that predicts tenant renewal probability based on lease terms, market conditions, and tenant performance. Alert landlords 12-18 months before expiry with recommended retention strategies. `L`

42. [ ] **Automated Market Reports** — Generate monthly PDF reports for Premium/Enterprise users with personalized market insights, competitor intelligence, and recommended actions. Use CrewAI for AI-driven content generation. `M`

## Notes
- Order prioritizes technical dependencies (auth/profiles → matching → collaboration → intelligence)
- Each item represents end-to-end functionality (frontend + backend + database)
- MVP (items 1-8) delivers core value: tenant profiles, property listings, basic matching, messaging, payments
- Collaboration phase (9-14) unlocks team features required for Pro/Premium tiers
- Intelligence phase (15-21) differentiates product with AI/ML and market data
- Optimization phase (29-36) reduces vendor costs by building/migrating core infrastructure
- Enterprise phase (37-42) captures high-value national brand customers
- Features are gated by subscription tier as defined in mission.md
