# Figma Design Alignment Implementation Plan
## Tenant Dashboard Visual Redesign

**Objective**: Apply Figma design elements to the existing tenant dashboard while preserving all current functionality (business profile management).

**Scope**: Visual and styling updates only - no functional changes to the tenant flow.

---

## Overview

### Current State
- Tenant dashboard at `/dashboard`
- Business profile management functionality
- KPI cards, business listings, infinite scroll
- WebSocket real-time updates
- Modals for create/edit/delete operations

### Target State
- Same functionality with Figma-aligned visual design
- Updated color system matching Figma tokens
- SF Pro typography
- Refined spacing, borders, shadows
- Enhanced component styling

---

## Phase 1: Design System Foundation (Days 1-2)

### 1.1 Create Design Tokens File
**File**: `src/frontend/styles/design-tokens.css`

**Tasks**:
- [ ] Create new CSS custom properties file
- [ ] Define Figma color palette
- [ ] Define typography scale
- [ ] Define spacing system
- [ ] Define border radius values
- [ ] Define shadow values

**Design Tokens to Implement**:

```css
:root {
  /* Brand Colors - From Figma */
  --zyx-white: #FFFFFF;
  --zyx-gray-100: #F9FAFB;
  --zyx-gray-200: #EFF2F6;
  --zyx-gray-400: #8091A5;
  --zyx-gray-500: #5A6A7D;
  --zyx-gray-600: #313541;
  --zyx-gray-700: #16181E;

  /* Semantic Colors */
  --zyx-info: #4177FF;
  --zyx-info-light: #F3F9FF;
  --zyx-success: #10B981;
  --zyx-warning: #F59E0B;
  --zyx-error: #EF4444;

  /* Typography - SF Pro Font Stack */
  --font-family-primary: 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Font Sizes - From Figma Design Tokens */
  --font-size-12: 12px;
  --font-size-14: 14px;
  --font-size-16: 16px;
  --font-size-18: 18px;
  --font-size-24: 24px;
  --font-size-28: 28px;
  --font-size-36: 36px;
  --font-size-48: 48px;

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 590;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.5;
  --line-height-24: 24px;
  --line-height-28: 28px;
  --line-height-36: 36px;

  /* Letter Spacing */
  --letter-spacing-tight: 0px;
  --letter-spacing-normal: 0.1px;
  --letter-spacing-wide: 0.15px;

  /* Spacing Scale */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Border Radius */
  --radius-4: 4px;
  --radius-8: 8px;
  --radius-12: 12px;
  --radius-full: 50px;

  /* Shadows - Figma Elevation */
  --shadow-card: 0px 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0px 8px 16px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0px 10px 40px rgba(0, 0, 0, 0.15);

  /* Borders */
  --border-width: 1px;
  --border-color-light: var(--zyx-gray-200);
  --border-color-default: #E5E5EA;
}
```

**Implementation Steps**:
1. Create `src/frontend/styles/design-tokens.css`
2. Import in `src/frontend/index.css` at the top
3. Run visual regression test to ensure no breaking changes

**Verification**:
- [ ] Design tokens file created
- [ ] Imported correctly in index.css
- [ ] DevTools shows new CSS variables available
- [ ] No visual regressions in existing UI

---

### 1.2 Install SF Pro Font Family
**Files**: `public/fonts/`, `src/frontend/index.css`

**Tasks**:
- [ ] Download SF Pro font files (Regular, Medium, Semibold, Bold)
- [ ] Add font files to `public/fonts/sf-pro/`
- [ ] Create @font-face declarations
- [ ] Update global font-family

**Font Files Needed**:
- SF-Pro-Text-Regular.woff2
- SF-Pro-Text-Medium.woff2
- SF-Pro-Text-Semibold.woff2
- SF-Pro-Text-Bold.woff2

**@font-face Declarations**:
```css
@font-face {
  font-family: 'SF Pro';
  src: url('/fonts/sf-pro/SF-Pro-Text-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro';
  src: url('/fonts/sf-pro/SF-Pro-Text-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro';
  src: url('/fonts/sf-pro/SF-Pro-Text-Semibold.woff2') format('woff2');
  font-weight: 590;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro';
  src: url('/fonts/sf-pro/SF-Pro-Text-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**Verification**:
- [ ] Fonts load correctly in browser DevTools
- [ ] Typography renders with SF Pro across the app
- [ ] Fallback fonts work if SF Pro fails to load
- [ ] No FOUT (Flash of Unstyled Text)

---

### 1.3 Update Global Styles
**File**: `src/frontend/index.css`

**Tasks**:
- [ ] Replace existing CSS variables with Figma tokens
- [ ] Update body font-family to use SF Pro
- [ ] Update global color references
- [ ] Test dark mode compatibility (if applicable)

**Changes**:
```css
/* Update root variables */
:root {
  /* Replace existing variables with design tokens */
  --color-primary: var(--zyx-info);
  --color-background: var(--zyx-white);
  --color-surface: var(--zyx-gray-100);
  --color-border: var(--zyx-gray-200);
  --color-text-primary: var(--zyx-gray-700);
  --color-text-secondary: var(--zyx-gray-600);
  --font-family: var(--font-family-primary);
}

body {
  font-family: var(--font-family-primary);
  color: var(--zyx-gray-700);
  background-color: var(--zyx-gray-100);
}
```

**Verification**:
- [ ] All pages render correctly
- [ ] Typography is consistent
- [ ] Colors match Figma design
- [ ] No broken styles

---

## Phase 2: Component Updates (Days 3-7)

### 2.1 KPICard Component
**Files**:
- `src/frontend/components/KPICard.module.css`
- `src/frontend/components/KPICard.tsx`

**Current State Analysis**:
- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Border radius: `12px`
- Padding: `24px`
- Title: `14px`, `500 weight`, `#6b7280`
- Value: `36px`, `700 weight`, `#111827`

**Figma Target**:
- Background: `var(--zyx-white)`
- Border: `1px solid var(--zyx-gray-200)` (#EFF2F6)
- Border radius: `var(--radius-12)`
- Padding: `var(--spacing-16)` (16px, not 24px per Figma)
- Title: `var(--font-size-14)`, `var(--font-weight-regular)`, `var(--zyx-gray-600)` (#313541)
- Value: `var(--font-size-24)`, `var(--font-weight-regular)`, `var(--zyx-gray-700)` (#16181E)
- Trend text: `var(--font-size-14)`, `var(--zyx-gray-400)` (#8091A5)

**Tasks**:
- [ ] Update color variables to use design tokens
- [ ] Adjust padding from 24px to 16px
- [ ] Update font sizes (value from 36px to 24px)
- [ ] Update title color to #313541
- [ ] Update value color to #16181E
- [ ] Update trend period color to #8091A5
- [ ] Adjust icon container styling
- [ ] Update hover shadow

**CSS Changes**:
```css
.kpiCard {
  background: var(--zyx-white);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--radius-12);
  padding: var(--spacing-16);
}

.kpiCard:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.kpiTitle {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
  line-height: var(--line-height-24);
}

.kpiValue {
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-700);
  line-height: var(--line-height-28);
  letter-spacing: var(--letter-spacing-tight);
}

.trendPeriod {
  font-size: var(--font-size-14);
  color: var(--zyx-gray-400);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-24);
}

.iconContainer {
  width: 32px;
  height: 32px;
  background: transparent; /* Remove gray background */
  border-radius: var(--radius-8);
}

.icon {
  width: 32px;
  height: 32px;
  color: var(--zyx-gray-600);
}
```

**Verification**:
- [ ] KPI cards match Figma design visually
- [ ] All four KPIs on dashboard render correctly
- [ ] Hover states work
- [ ] Loading states work
- [ ] Locked states work (if applicable)
- [ ] Responsive breakpoints maintained

---

### 2.2 BusinessCard Component
**Files**:
- `src/frontend/components/BusinessCard.module.css`
- `src/frontend/components/BusinessCard.tsx`

**Tasks**:
- [ ] Update card background to `var(--zyx-white)`
- [ ] Update border to `1px solid var(--border-color-light)`
- [ ] Update border-radius to `var(--radius-12)`
- [ ] Update padding to match Figma spacing
- [ ] Update typography (titles, labels, body text)
- [ ] Update badge colors
- [ ] Update button styles
- [ ] Update hover shadow

**Typography Updates**:
```css
.businessName {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
  color: var(--zyx-gray-700);
  line-height: var(--line-height-28);
  letter-spacing: var(--letter-spacing-wide);
}

.businessCategory {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
}

.businessMetric {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
  letter-spacing: var(--letter-spacing-normal);
}
```

**Verification**:
- [ ] Business cards match Figma styling
- [ ] Card grid layout intact
- [ ] All interactive elements work
- [ ] Status badges visible
- [ ] Three-dot menu functional

---

### 2.3 DashboardHeader Component
**Files**:
- `src/frontend/components/DashboardHeader.module.css`
- `src/frontend/components/DashboardHeader.tsx`

**Tasks**:
- [ ] Update heading font to SF Pro
- [ ] Set heading size to `var(--font-size-24)`
- [ ] Set heading weight to `var(--font-weight-medium)`
- [ ] Update subtitle color to `var(--zyx-gray-600)`
- [ ] Update subtitle size to `var(--font-size-16)`
- [ ] Adjust spacing

**CSS Changes**:
```css
.headerTitle {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-medium);
  color: var(--zyx-gray-700);
  line-height: var(--line-height-28);
  letter-spacing: var(--letter-spacing-tight);
}

.headerSubtitle {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
  line-height: var(--line-height-24);
  letter-spacing: var(--letter-spacing-normal);
}
```

**Verification**:
- [ ] Header text matches Figma
- [ ] Spacing correct
- [ ] Color contrast accessible

---

### 2.4 TopNavigation Component
**Files**:
- `src/frontend/components/TopNavigation.module.css`
- `src/frontend/components/TopNavigation.tsx`

**Tasks**:
- [ ] Update background to `var(--zyx-white)`
- [ ] Update border-bottom color
- [ ] Update logo/brand text styling
- [ ] Update navigation link typography
- [ ] Update icon colors
- [ ] Update avatar/profile dropdown styling

**CSS Changes**:
```css
.topNav {
  background: var(--zyx-white);
  border-bottom: var(--border-width) solid var(--border-color-light);
  padding: var(--spacing-12) var(--spacing-64);
}

.navLink {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
  letter-spacing: var(--letter-spacing-wide);
}

.navLink.active {
  color: var(--zyx-gray-700);
  border-bottom: 2px solid var(--zyx-info);
}

.brandText {
  font-size: var(--font-size-28);
  font-weight: var(--font-weight-semibold);
  color: var(--zyx-gray-700);
  letter-spacing: var(--letter-spacing-tight);
}
```

**Verification**:
- [ ] Navigation matches Figma
- [ ] Active states work
- [ ] Dropdown menus styled correctly
- [ ] Icons aligned

---

### 2.5 Modal Components
**Files**:
- `src/frontend/components/BusinessProfileModal.module.css`
- `src/frontend/components/BusinessProfileStep2Modal.module.css`
- `src/frontend/components/DemandListingModal.module.css`
- `src/frontend/components/EditBusinessModal.module.css`
- `src/frontend/components/DeleteBusinessModal.module.css`

**Tasks for All Modals**:
- [ ] Update modal background to `var(--zyx-white)`
- [ ] Update overlay background
- [ ] Update border-radius to `var(--radius-12)`
- [ ] Update shadow to `var(--shadow-modal)`
- [ ] Update heading typography
- [ ] Update button styles (primary, secondary, danger)
- [ ] Update input field styles
- [ ] Update label typography

**Button Styles (Figma)**:
```css
.primaryButton {
  background: var(--zyx-gray-700); /* #16181E */
  color: var(--zyx-white);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-10) var(--spacing-24);
  border-radius: var(--radius-8);
  border: none;
  letter-spacing: var(--letter-spacing-normal);
}

.secondaryButton {
  background: var(--zyx-white);
  color: var(--zyx-gray-600);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-10) var(--spacing-24);
  border-radius: var(--radius-8);
  border: var(--border-width) solid var(--zyx-gray-600);
}
```

**Input Fields (Figma)**:
```css
.inputField {
  background: var(--zyx-gray-100); /* #F9FAFB */
  border: var(--border-width) solid #E5E5EA;
  border-radius: var(--radius-4);
  padding: var(--spacing-8);
  font-size: var(--font-size-16);
  color: var(--zyx-gray-700);
}

.inputField::placeholder {
  color: #D1D1D6; /* Gray-4 */
}

.inputLabel {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-regular);
  color: var(--zyx-gray-600);
  margin-bottom: var(--spacing-4);
}
```

**Verification**:
- [ ] All modals styled consistently
- [ ] Form inputs match Figma
- [ ] Buttons have correct states (hover, active, disabled)
- [ ] Modal animations smooth
- [ ] Accessibility maintained

---

### 2.6 Badge Components
**Files**:
- `src/frontend/components/StatusBadge.module.css`
- `src/frontend/components/CategoryBadge.module.css`
- `src/frontend/components/TierBadge.module.css`

**Tasks**:
- [ ] Update border-radius to pill shape
- [ ] Update padding to `4px 12px`
- [ ] Update typography to `12px` semibold
- [ ] Ensure color contrast for accessibility

**Badge Styles**:
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}

.badgeActive {
  background: var(--zyx-info-light);
  color: var(--zyx-info);
}

.badgePending {
  background: #FEF3C7;
  color: var(--zyx-warning);
}
```

**Verification**:
- [ ] Badges match Figma design
- [ ] All status variants work
- [ ] Color contrast meets WCAG AA

---

### 2.7 Search and Filter Components
**Files**:
- `src/frontend/components/SearchInput.module.css`
- `src/frontend/components/FilterDropdown.module.css`

**Tasks**:
- [ ] Update input background to `var(--zyx-gray-100)`
- [ ] Update border color
- [ ] Update placeholder color
- [ ] Update icon colors
- [ ] Update dropdown styling
- [ ] Update filter chip styles

**Search Input**:
```css
.searchInput {
  background: var(--zyx-gray-100);
  border: var(--border-width) solid var(--border-color-default);
  border-radius: var(--radius-8);
  padding: var(--spacing-12) var(--spacing-16);
  font-size: var(--font-size-16);
  color: var(--zyx-gray-700);
}

.searchInput::placeholder {
  color: var(--zyx-gray-400);
}
```

**Verification**:
- [ ] Search input matches Figma
- [ ] Filter dropdown styled correctly
- [ ] Clear button works
- [ ] Focus states visible

---

### 2.8 Connection Indicator
**Files**:
- `src/frontend/components/ConnectionIndicator.module.css`
- `src/frontend/components/ConnectionIndicator.tsx`

**Tasks**:
- [ ] Update colors for connected/disconnected states
- [ ] Update typography
- [ ] Update icon or dot styling
- [ ] Ensure visibility on all backgrounds

**Verification**:
- [ ] Indicator visible in all states
- [ ] Color-blind friendly colors
- [ ] Positioning correct

---

### 2.9 Empty State Component
**Files**:
- `src/frontend/components/EmptyState.module.css`
- `src/frontend/components/EmptyState.tsx`

**Tasks**:
- [ ] Update icon/illustration colors
- [ ] Update heading typography
- [ ] Update description text color
- [ ] Update CTA button styling

**Verification**:
- [ ] Empty state matches Figma aesthetic
- [ ] Message clear and actionable
- [ ] Button styled correctly

---

## Phase 3: Page-Level Updates (Days 8-9)

### 3.1 Dashboard Page
**Files**:
- `src/frontend/pages/Dashboard.module.css`
- `src/frontend/pages/Dashboard.tsx`

**Tasks**:
- [ ] Update page background to `var(--zyx-gray-100)`
- [ ] Verify section spacing matches Figma
- [ ] Update grid/flexbox layouts if needed
- [ ] Ensure responsive breakpoints work
- [ ] Update loading skeleton styles

**Layout Spacing (Figma)**:
```css
.dashboardContainer {
  background: var(--zyx-gray-100);
  min-height: 100vh;
  padding: 0;
}

.dashboardContent {
  max-width: 1312px; /* Figma shows 1376px - 64px padding */
  margin: 0 auto;
  padding: 0 var(--spacing-64);
}

.section {
  margin-bottom: var(--spacing-32);
}

.kpiGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-24);
  margin-bottom: var(--spacing-32);
}
```

**Verification**:
- [ ] Page layout matches Figma
- [ ] All sections aligned
- [ ] Spacing consistent
- [ ] Responsive design intact

---

### 3.2 Business Detail Page
**Files**:
- `src/frontend/pages/BusinessDetail.module.css`
- `src/frontend/pages/BusinessDetail.tsx`

**Tasks**:
- [ ] Apply design token colors
- [ ] Update typography
- [ ] Update card styles
- [ ] Update button styles
- [ ] Update metric displays

**Verification**:
- [ ] Detail page styled consistently
- [ ] All information displayed correctly
- [ ] Actions work properly

---

## Phase 4: Responsive Design Verification (Day 10)

### 4.1 Mobile Breakpoints
**Devices to Test**:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPhone 14 Pro Max (430px)
- iPad Mini (768px)
- iPad Pro (1024px)

**Tasks**:
- [ ] Test all components at mobile widths
- [ ] Verify KPI cards stack correctly
- [ ] Verify business cards display properly
- [ ] Test modals on mobile
- [ ] Test navigation collapse
- [ ] Verify touch targets (min 44px)

**Mobile-Specific Updates**:
```css
@media (max-width: 768px) {
  .kpiGrid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-16);
  }

  .dashboardContent {
    padding: 0 var(--spacing-20);
  }

  .kpiCard {
    padding: var(--spacing-12);
  }

  .kpiValue {
    font-size: var(--font-size-18);
  }
}

@media (max-width: 480px) {
  .kpiGrid {
    grid-template-columns: 1fr;
  }
}
```

**Verification Checklist**:
- [ ] All text readable on mobile
- [ ] No horizontal scrolling
- [ ] Touch targets adequate size
- [ ] Modals work on mobile
- [ ] Forms usable on mobile

---

### 4.2 Tablet Breakpoints
**Devices to Test**:
- iPad (768px - 1024px)

**Tasks**:
- [ ] Test layout at tablet widths
- [ ] Verify grid columns adjust
- [ ] Test modals width
- [ ] Verify touch interactions

**Verification**:
- [ ] Layout optimized for tablet
- [ ] No wasted space
- [ ] All interactions work

---

### 4.3 Desktop Breakpoints
**Widths to Test**:
- 1280px (small desktop)
- 1440px (standard)
- 1920px (large)

**Tasks**:
- [ ] Verify max-width constraints
- [ ] Test grid layouts
- [ ] Ensure content doesn't stretch too wide

**Verification**:
- [ ] Content centered appropriately
- [ ] Max-width applied where needed
- [ ] Grid columns use available space

---

## Phase 5: Accessibility & Polish (Days 11-12)

### 5.1 Color Contrast
**Tools**:
- Chrome DevTools Accessibility Panel
- WAVE Extension
- axe DevTools

**Tasks**:
- [ ] Verify all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Check focus indicators visible
- [ ] Test color-blind modes
- [ ] Ensure interactive elements distinguishable

**Critical Combinations to Check**:
- [ ] `var(--zyx-gray-600)` on `var(--zyx-white)` - Body text
- [ ] `var(--zyx-gray-400)` on `var(--zyx-white)` - Secondary text
- [ ] `var(--zyx-info)` on `var(--zyx-white)` - Links/buttons
- [ ] Button text on button backgrounds

**Verification**:
- [ ] All text passes contrast check
- [ ] No contrast warnings in DevTools
- [ ] UI usable in high contrast mode

---

### 5.2 Focus States
**Tasks**:
- [ ] Add visible focus outlines to all interactive elements
- [ ] Use `:focus-visible` for keyboard-only focus
- [ ] Ensure focus order logical
- [ ] Test with keyboard navigation only

**Focus Styles**:
```css
*:focus-visible {
  outline: 2px solid var(--zyx-info);
  outline-offset: 2px;
  border-radius: var(--radius-4);
}

.button:focus-visible,
.input:focus-visible,
.link:focus-visible {
  outline: 2px solid var(--zyx-info);
  outline-offset: 2px;
}
```

**Verification**:
- [ ] Tab order makes sense
- [ ] All interactive elements focusable
- [ ] Focus visible on all elements
- [ ] No focus traps

---

### 5.3 Screen Reader Testing
**Tools**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac)

**Tasks**:
- [ ] Test KPI cards with screen reader
- [ ] Verify business cards announced correctly
- [ ] Test modal dialogs
- [ ] Verify form labels
- [ ] Check ARIA attributes

**Verification**:
- [ ] All content accessible via screen reader
- [ ] Proper heading hierarchy
- [ ] Form fields properly labeled
- [ ] Buttons have descriptive text

---

### 5.4 Animation & Motion
**Tasks**:
- [ ] Respect `prefers-reduced-motion`
- [ ] Ensure animations enhance UX
- [ ] Keep animations subtle
- [ ] Disable non-essential animations for users who prefer reduced motion

**CSS**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Verification**:
- [ ] Reduced motion setting respected
- [ ] No jarring animations
- [ ] Transitions smooth

---

## Phase 6: Testing & Quality Assurance (Days 13-14)

### 6.1 Visual Regression Testing
**Tools**:
- Percy (if available)
- Manual screenshot comparison

**Tasks**:
- [ ] Take screenshots of all components before changes
- [ ] Take screenshots after each phase
- [ ] Compare against Figma designs
- [ ] Document any intentional deviations

**Components to Screenshot**:
- [ ] KPI Cards (all states)
- [ ] Business Cards (all states)
- [ ] Dashboard Header
- [ ] Top Navigation
- [ ] Modals (all types)
- [ ] Badges (all types)
- [ ] Search Input
- [ ] Filter Dropdown
- [ ] Empty State
- [ ] Loading States
- [ ] Error States

**Verification**:
- [ ] Visual match with Figma
- [ ] No unintended regressions
- [ ] Responsive views correct

---

### 6.2 Cross-Browser Testing
**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Tasks**:
- [ ] Test layout in each browser
- [ ] Verify CSS compatibility
- [ ] Test interactions
- [ ] Check font rendering

**Verification**:
- [ ] Consistent appearance across browsers
- [ ] All features work
- [ ] No layout breaks

---

### 6.3 Performance Testing
**Tools**:
- Chrome DevTools Performance Panel
- Lighthouse

**Tasks**:
- [ ] Measure page load time
- [ ] Check for layout shifts (CLS)
- [ ] Verify font loading strategy
- [ ] Optimize CSS delivery
- [ ] Check bundle size impact

**Performance Metrics**:
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3.8s

**Verification**:
- [ ] Lighthouse score > 90
- [ ] No performance regressions
- [ ] Font loading optimized

---

### 6.4 Functional Testing
**Test Scenarios**:

**Dashboard**:
- [ ] Load dashboard with businesses
- [ ] Load dashboard without businesses (empty state)
- [ ] WebSocket connection/disconnection
- [ ] Real-time KPI updates
- [ ] Business card interactions
- [ ] Infinite scroll loading
- [ ] Search functionality
- [ ] Filter functionality

**Business Profile Creation**:
- [ ] Open modal
- [ ] Fill step 1
- [ ] Proceed to step 2
- [ ] Complete creation
- [ ] See new business appear

**Business Editing**:
- [ ] Open edit modal
- [ ] Modify fields
- [ ] Save changes
- [ ] See updated business

**Business Deletion**:
- [ ] Open delete modal
- [ ] Confirm deletion
- [ ] See business removed

**Verification**:
- [ ] All functionality intact
- [ ] No regressions introduced
- [ ] Error handling works

---

## Phase 7: Documentation & Handoff (Day 15)

### 7.1 Update Component Documentation
**Tasks**:
- [ ] Document new design token usage
- [ ] Update component prop descriptions
- [ ] Add Storybook stories (if applicable)
- [ ] Update README with design system info

**Documentation to Create**:
- Design token reference guide
- Component usage examples
- Accessibility guidelines
- Responsive breakpoint guide

---

### 7.2 Create Style Guide
**File**: `STYLE_GUIDE.md`

**Content**:
- Color palette with hex codes
- Typography scale
- Spacing scale
- Component patterns
- Do's and Don'ts
- Code examples

---

### 7.3 Migration Guide
**File**: `FIGMA_MIGRATION_GUIDE.md`

**Content**:
- Summary of changes made
- Before/after comparisons
- Breaking changes (if any)
- Update instructions for future components
- How to use design tokens

---

## Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Design System Foundation | 2 days | Design tokens, SF Pro font, global styles |
| Phase 2: Component Updates | 5 days | All component styling updates |
| Phase 3: Page-Level Updates | 2 days | Dashboard and detail pages |
| Phase 4: Responsive Verification | 1 day | Mobile, tablet, desktop testing |
| Phase 5: Accessibility & Polish | 2 days | A11y, focus states, color contrast |
| Phase 6: Testing & QA | 2 days | Visual regression, cross-browser, performance |
| Phase 7: Documentation | 1 day | Style guide, migration guide |
| **Total** | **15 days** | **Complete Figma alignment** |

---

## Rollout Strategy

### Option A: Big Bang (Not Recommended)
- Complete all phases
- Deploy all changes at once
- Risk: Large surface area for bugs

### Option B: Incremental (Recommended)
1. **Week 1**: Deploy Phase 1 (Design Foundation)
2. **Week 2**: Deploy Phase 2 (Core Components)
3. **Week 3**: Deploy Phases 3-7 (Pages, Testing, Documentation)

**Benefits**:
- Smaller, manageable deployments
- Easier to identify and fix issues
- Continuous user feedback

---

## Success Criteria

- [ ] Visual match with Figma design (95%+ accuracy)
- [ ] No functional regressions
- [ ] All accessibility checks pass
- [ ] Performance metrics maintained or improved
- [ ] Cross-browser compatibility
- [ ] Responsive design works on all devices
- [ ] Documentation complete
- [ ] Team trained on design token usage

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SF Pro font licensing | High | Low | Use system fonts fallback, verify license |
| Breaking existing styles | High | Medium | Thorough testing, incremental rollout |
| Performance degradation | Medium | Low | Performance testing, optimize CSS |
| Accessibility regressions | High | Low | A11y testing throughout |
| Browser incompatibility | Medium | Low | Cross-browser testing |

---

## Tools & Resources

### Required Tools
- Figma (for design reference)
- Chrome DevTools
- VS Code with CSS IntelliSense
- Browser DevTools (all browsers)

### Helpful Extensions
- Figma to Code
- CSS Peeper
- WAVE Accessibility
- axe DevTools
- Lighthouse

### Testing Tools
- Percy or Chromatic (visual regression)
- Lighthouse (performance)
- NVDA or VoiceOver (screen readers)

---

## Notes

- Keep the original CSS files as backup before making changes
- Use CSS variables consistently - avoid hardcoded values
- Test on real devices, not just browser DevTools
- Get design approval at each phase
- Maintain backward compatibility where possible
- Document any intentional deviations from Figma

---

## Questions for Clarification

Before starting implementation:
1. Do we have a valid license for SF Pro font?
2. Should we maintain dark mode compatibility?
3. Are there any legacy browser requirements (IE11)?
4. What is the target Lighthouse score?
5. Do we need to support RTL languages?
6. Should we create a component library/Storybook?

---

**Next Steps**: Review this plan, address questions, and begin Phase 1.
