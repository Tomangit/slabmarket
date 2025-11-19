# Slab Market - Design System & UX/UI Documentation

## 📐 Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: `#3b82f6` (hsl(217, 91%, 60%))
  - Used for: CTAs, links, primary buttons, active states
  - Hover: `#2563eb` (darker)
  - Light: `#dbeafe` (backgrounds, highlights)

#### Neutral Colors
- **Background Light**: `#ffffff` (white)
- **Background Dark**: `#0f172a` (slate-950)
- **Foreground Light**: `#1e293b` (slate-800)
- **Foreground Dark**: `#f1f5f9` (slate-100)
- **Border**: `#e2e8f0` (slate-200) / `#1e293b` (dark mode)

#### Semantic Colors
- **Success/Green**: `#10b981` - Verified badges, success messages
- **Warning/Yellow**: `#f59e0b` - Warnings, pending states
- **Error/Red**: `#ef4444` - Errors, destructive actions, banned users
- **Info/Blue**: `#3b82f6` - Information, links

#### Grading Company Colors
- **PSA**: `#1a1a1a` (black) with white text
- **BGS**: `#003366` (navy blue)
- **CGC**: `#0066cc` (blue)
- **SGC**: `#ff6600` (orange)
- **ACE**: `#800080` (purple)

### Typography

#### Font Families
- **Primary**: System font stack (Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **Monospace**: For card numbers, prices, IDs

#### Font Sizes
- **Display**: 3rem (48px) - Hero headlines
- **H1**: 2.25rem (36px) - Page titles
- **H2**: 1.875rem (30px) - Section titles
- **H3**: 1.5rem (24px) - Subsection titles
- **H4**: 1.25rem (20px) - Card titles
- **Body Large**: 1.125rem (18px) - Important text
- **Body**: 1rem (16px) - Default text
- **Body Small**: 0.875rem (14px) - Secondary text
- **Caption**: 0.75rem (12px) - Labels, metadata

#### Font Weights
- **Bold**: 700 - Headlines, emphasis
- **Semibold**: 600 - Subheadings, buttons
- **Medium**: 500 - Labels, important text
- **Regular**: 400 - Body text
- **Light**: 300 - Decorative text

### Spacing Scale
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)
- **4xl**: 6rem (96px)

### Border Radius
- **sm**: 0.25rem (4px) - Small elements
- **md**: 0.5rem (8px) - Default (cards, buttons)
- **lg**: 0.75rem (12px) - Large cards
- **xl**: 1rem (16px) - Modals, sheets
- **full**: 9999px - Pills, badges

### Shadows
- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`

### Breakpoints (Responsive)
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large Desktop**: > 1280px

---

## 🎨 Component Library

### Buttons

#### Primary Button
- Background: Primary Blue
- Text: White
- Padding: 0.75rem 1.5rem
- Border Radius: 0.5rem
- Hover: Darker blue, slight scale (1.02)
- Active: Pressed state (scale 0.98)

#### Secondary Button
- Background: Transparent
- Border: 1px solid border color
- Text: Foreground color
- Hover: Background with opacity

#### Ghost Button
- Background: Transparent
- Text: Foreground color
- Hover: Background with low opacity

### Cards

#### Product Card (Marketplace)
- Background: White / Dark slate
- Border: 1px solid border color
- Border Radius: 0.75rem
- Shadow: md on hover
- Padding: 1rem
- Image: Aspect ratio 3:4 (card dimensions)
- Hover: Scale 1.02, shadow-lg

#### Info Card
- Background: Muted color
- Border: None
- Border Radius: 0.5rem
- Padding: 1.5rem

### Inputs

#### Text Input
- Border: 1px solid border color
- Border Radius: 0.5rem
- Padding: 0.75rem 1rem
- Focus: Border primary color, ring 2px

#### Select
- Same as text input
- Dropdown arrow on right

### Badges

#### Status Badge
- Small pill shape
- Background: Semantic color
- Text: White
- Padding: 0.25rem 0.75rem
- Font Size: 0.75rem

#### Grade Badge
- Circular or rounded square
- Background: Grading company color
- Text: White
- Size: 2rem x 2rem

---

## 📱 Key Screens Specifications

### 1. Landing Page (Homepage)

#### Hero Section
```
┌─────────────────────────────────────────┐
│  [Logo]  Nav Links...  [Theme] [Sign In]│
├─────────────────────────────────────────┤
│                                         │
│         [Badge: Launching with...]      │
│                                         │
│    The Premium Marketplace for          │
│      Graded Trading Cards               │
│                                         │
│    Buy and sell authenticated...        │
│                                         │
│    [Browse Marketplace] [Start Selling]│
│                                         │
│  ✓ Verified  🛡️ Protected  🚫 Banned   │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**
- Hero headline with gradient text
- Two CTA buttons (primary + secondary)
- Trust indicators (5 icons with text)
- Announcement badge at top

**Spacing:**
- Section padding: 5rem vertical
- Max width: 4xl (56rem)
- Centered content

#### Trusted Companies Section
- Horizontal list of grading company names
- Large, bold text
- Subtle background color

#### Features Section
- Grid of 6 feature cards
- Icon + Title + Description
- 3 columns on desktop, 1 on mobile

#### Featured Listings Section
- Grid of 8 product cards
- "Featured" badge on cards
- Horizontal scroll on mobile
- "View All" link

#### Hot Deals Section
- Similar to Featured
- "Hot Deal" badge with flame icon
- Price comparison (original vs. deal)

#### Added Today Section
- Similar layout
- "New" badge
- Timestamp (e.g., "2 hours ago")

### 2. Marketplace (Search & Browse)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Logo]  Nav...  [Search Bar]  [Filters]│
├─────────────────────────────────────────┤
│  Filters Sidebar  │  Product Grid       │
│  - Price Range    │  [Card] [Card]     │
│  - Grade          │  [Card] [Card]     │
│  - Set            │  [Card] [Card]     │
│  - Edition        │  [Card] [Card]     │
│  - Company        │  [Card] [Card]     │
│                   │  [Pagination]      │
└─────────────────────────────────────────┘
```

**Key Features:**
- Sticky search bar
- Collapsible filter sidebar (sheet on mobile)
- Grid/List view toggle
- Sort dropdown (price, popularity, date)
- Pagination at bottom
- Results count display

**Product Card Elements:**
- Card image (3:4 aspect ratio)
- Card name + set name
- Grade badge
- Price (large, bold)
- Seller info (optional)
- Quick actions (Add to Cart, Wishlist)

### 3. Card Detail Page

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Breadcrumbs: Home / Marketplace / Card]│
├─────────────────────────────────────────┤
│  [Card Image]  │  Card Info             │
│  (Large)       │  - Name + Set          │
│                │  - Card Number         │
│                │  - Grade Options       │
│                │  - Price Range         │
│                │  - Market Stats        │
│                │  - [Compare Prices]    │
├─────────────────────────────────────────┤
│  Available Listings                     │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │Slab │ │Slab │ │Slab │               │
│  └─────┘ └─────┘ └─────┘               │
│  - Grade, Price, Seller                 │
│  - [Add to Cart] [Details]              │
├─────────────────────────────────────────┤
│  Price History Chart                    │
│  [Line Chart: Price over time]         │
├─────────────────────────────────────────┤
│  Market Index                           │
│  - PSA 10 Index                         │
│  - Grade Index                          │
└─────────────────────────────────────────┘
```

**Key Features:**
- Large card image (zoomable)
- Edition icons (1st Edition, Shadowless, etc.)
- Grade filter dropdown
- Price history chart (Recharts)
- Market statistics
- Available listings table/grid
- Compare prices button

### 4. Slab Detail Page

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Breadcrumbs]                          │
├─────────────────────────────────────────┤
│  [Slab Images]  │  Slab Info            │
│  (Multiple)     │  - Card Name          │
│                 │  - Grade + Company     │
│                 │  - Certificate #      │
│                 │  - Price             │
│                 │  - Seller Info       │
│                 │  - [Add to Cart]      │
│                 │  - [Message Seller]   │
├─────────────────────────────────────────┤
│  Certificate Verification               │
│  - Company Logo                         │
│  - Certificate Number                  │
│  - Verification Status                 │
│  - [Verify Now]                        │
├─────────────────────────────────────────┤
│  Seller Information                    │
│  - Avatar + Name                        │
│  - Rating + Sales Count                │
│  - Response Time                       │
│  - [View Profile]                      │
├─────────────────────────────────────────┤
│  Similar Listings                      │
│  [Card Grid]                            │
└─────────────────────────────────────────┘
```

**Key Features:**
- Image gallery (multiple angles)
- Certificate verification section
- Seller profile card
- Similar listings recommendations
- Add to cart (prominent)
- Message seller button

### 5. Shopping Cart

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Shopping Cart (3 items)                │
├─────────────────────────────────────────┤
│  Item 1          │  Price    │  [Remove]│
│  [Image] Card    │  $XXX.XX  │          │
│  Grade: PSA 10   │           │          │
│  Seller: Name    │           │          │
├─────────────────────────────────────────┤
│  Item 2          │  Price    │  [Remove]│
│  ...                                    │
├─────────────────────────────────────────┤
│  Subtotal: $XXX.XX                      │
│  Shipping: Calculated at checkout       │
│  ─────────────────────────────────────  │
│  Total: $XXX.XX                         │
│                                         │
│  [Continue Shopping]  [Proceed to Checkout]│
└─────────────────────────────────────────┘
```

**Key Features:**
- Item list with images
- Quantity selector (if applicable)
- Remove item button
- Price breakdown
- Empty state message
- Continue shopping link

### 6. Checkout

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Checkout                               │
├─────────────────────────────────────────┤
│  Shipping Address    │  Order Summary   │
│  [Form Fields]       │  Items (3)      │
│  - Full Name         │  Subtotal        │
│  - Address           │  Shipping        │
│  - City, ZIP         │  Fees           │
│  - Country           │  ─────────────  │
│                      │  Total           │
│  Payment Method      │                  │
│  [Card Details]      │  [Place Order]   │
│  - Card Number       │                  │
│  - Expiry            │                  │
│  - CVV               │                  │
│                      │                  │
│  [Back to Cart]      │                  │
└─────────────────────────────────────────┘
```

**Key Features:**
- Multi-step form (address → payment → review)
- Address validation
- Payment method selection
- Order summary sidebar (sticky)
- Security badges
- Terms acceptance checkbox

### 7. Seller Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Dashboard                              │
├─────────────────────────────────────────┤
│  Stats Cards                            │
│  [Total Sales] [Active Listings]        │
│  [Revenue] [Pending Orders]             │
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  [Create Listing] [Bulk Tools]         │
├─────────────────────────────────────────┤
│  My Listings                            │
│  [Table/Grid of listings]               │
│  - Status, Price, Views                 │
│  - [Edit] [Delete] [Promote]            │
├─────────────────────────────────────────┤
│  Recent Orders                          │
│  [Table of orders]                      │
│  - Order #, Buyer, Status               │
│  - [View Details]                       │
└─────────────────────────────────────────┘
```

**Key Features:**
- Stats overview cards
- Quick action buttons
- Listings management table
- Bulk actions (select multiple)
- Filters (status, date range)
- Export to CSV

---

## 🔄 User Flows

### Flow 1: Buying a Card

```
1. Landing Page
   ↓
2. Browse Marketplace (or Search)
   ↓
3. Filter/Sort Results
   ↓
4. View Card Detail Page
   ↓
5. Select Grade/Listing
   ↓
6. Add to Cart
   ↓
7. Review Cart
   ↓
8. Proceed to Checkout
   ↓
9. Enter Shipping Address
   ↓
10. Enter Payment Details
   ↓
11. Review Order
   ↓
12. Place Order
   ↓
13. Order Confirmation
   ↓
14. Track Order (Dashboard)
```

### Flow 2: Selling a Card

```
1. Dashboard
   ↓
2. Click "Create Listing"
   ↓
3. Select Card (Search/Select)
   ↓
4. Enter Listing Details
   - Grade
   - Price
   - Condition notes
   - Images
   ↓
5. Review Listing
   ↓
6. Publish Listing
   ↓
7. Listing Live (Dashboard)
   ↓
8. Receive Order Notification
   ↓
9. Ship Item
   ↓
10. Mark as Shipped
   ↓
11. Receive Payment (after delivery)
```

### Flow 3: Buyer Protection (Dispute)

```
1. Receive Item
   ↓
2. Verify Certificate
   ↓
3. Issue Found?
   ↓
4. Open Dispute
   ↓
5. Fill Dispute Form
   - Issue description
   - Photos
   - Evidence
   ↓
6. Submit Dispute
   ↓
7. Seller Response
   ↓
8. Admin Review
   ↓
9. Resolution
   - Refund
   - Return
   - Keep item
   ↓
10. Case Closed
```

---

## 📊 Homepage Sections UX Specification

### Featured Listings

**Purpose:** Showcase premium/high-value listings

**Display:**
- Grid of 8 cards (4 on tablet, 2 on mobile)
- "Featured" badge (top-right corner)
- Larger card size than regular marketplace
- Hover effect: slight scale + shadow

**Selection Criteria:**
- High-value cards (>$X)
- Recent listings (<7 days)
- High-grade (PSA 10, BGS 9.5+)
- Popular cards (trending)

**Interaction:**
- Click card → Card detail page
- "View All Featured" link → Marketplace with featured filter

### Hot Deals

**Purpose:** Highlight discounted listings

**Display:**
- Similar grid to Featured
- "Hot Deal" badge with flame icon
- Price comparison:
  - Original price (strikethrough, gray)
  - Deal price (large, red/green)
  - Discount percentage badge

**Selection Criteria:**
- Price reduced in last 24 hours
- Discount >10%
- Still available

**Interaction:**
- Same as Featured
- Timer countdown (optional): "Ends in X hours"

### Added Today

**Purpose:** Show fresh inventory

**Display:**
- Similar grid
- "New" badge (green)
- Timestamp: "X hours ago" or "Just added"
- Sort by: Most recent first

**Selection Criteria:**
- Listed in last 24 hours
- Active status
- Not already in Featured/Hot Deals

**Interaction:**
- Same as Featured
- Auto-refresh (optional): Show new items as they're added

---

## 📱 Mobile-First Considerations

### Navigation
- Hamburger menu on mobile
- Bottom navigation bar (optional)
- Sticky header with search

### Product Cards
- Full width on mobile
- Stack vertically
- Larger touch targets (min 44x44px)

### Filters
- Sheet/Modal on mobile
- Sticky "Apply Filters" button
- Clear all filters option

### Forms
- Full-width inputs
- Large touch targets
- Native date pickers
- Auto-focus next field

### Images
- Lazy loading
- Progressive loading
- Touch gestures (swipe, pinch zoom)

---

## 🎯 Accessibility Guidelines

### Color Contrast
- Text: WCAG AA (4.5:1 minimum)
- Large text: WCAG AA (3:1 minimum)
- Interactive elements: Clear focus states

### Keyboard Navigation
- Tab order: Logical flow
- Skip links: Jump to main content
- Focus indicators: Visible on all interactive elements

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for all images
- Form labels associated with inputs

### Touch Targets
- Minimum 44x44px
- Adequate spacing between interactive elements

---

## 🚀 Performance Considerations

### Image Optimization
- WebP format with fallback
- Responsive images (srcset)
- Lazy loading below fold
- Placeholder blur

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports for heavy components

### Caching
- Static assets: Long cache
- API responses: Short cache (5 min)
- Service worker for offline support (future)

---

## 📝 Next Steps for Implementation

1. **Create Figma/Sketch files** based on this documentation
2. **Build component library** in design tool
3. **Create high-fidelity mockups** for each screen
4. **User testing** with wireframes/mockups
5. **Iterate** based on feedback
6. **Handoff** to development with specs

---

*Last updated: [Current Date]*




