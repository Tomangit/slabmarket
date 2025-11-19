# Slab Market - User Flows & Interaction Patterns

## 🔄 Primary User Flows

### Flow 1: First-Time Buyer Journey

```
START: Landing Page
  │
  ├─→ Browse Featured Listings
  │   │
  │   └─→ Click on Card
  │       │
  │       └─→ Card Detail Page
  │           │
  │           ├─→ View Price History
  │           ├─→ Compare Prices
  │           └─→ Select Listing
  │               │
  │               └─→ Add to Cart
  │
  ├─→ Search for Specific Card
  │   │
  │   └─→ Marketplace Results
  │       │
  │       ├─→ Apply Filters
  │       │   (Price, Grade, Set)
  │       │
  │       └─→ View Card Detail
  │
  └─→ Sign Up / Sign In
      │
      └─→ Complete Profile
          │
          └─→ Add Payment Method
              │
              └─→ Ready to Buy
```

**Key Interactions:**
- Hover on card → Quick preview
- Click card → Navigate to detail
- Filter sidebar → Real-time results update
- Add to cart → Toast notification + cart badge update

---

### Flow 2: Experienced Buyer - Quick Purchase

```
START: Marketplace
  │
  ├─→ Search: "Charizard PSA 10"
  │
  ├─→ Filter: Price < $3000, PSA 10
  │
  ├─→ Sort: Price Low to High
  │
  ├─→ Click Best Match
  │
  ├─→ Verify Certificate
  │
  ├─→ Check Seller Rating
  │
  ├─→ Add to Cart
  │
  ├─→ Review Cart
  │
  ├─→ Checkout (1-click if saved)
  │
  └─→ Order Confirmation
```

**Optimizations:**
- Saved payment methods
- Saved shipping address
- One-click checkout for trusted sellers
- Quick reorder from history

---

### Flow 3: Seller - Create Listing

```
START: Dashboard
  │
  ├─→ Click "Create Listing"
  │
  ├─→ Step 1: Select Card
  │   │
  │   ├─→ Search Card Name
  │   │
  │   └─→ Select from Results
  │
  ├─→ Step 2: Enter Details
  │   │
  │   ├─→ Select Grade
  │   │
  │   ├─→ Enter Certificate #
  │   │
  │   ├─→ Set Price
  │   │   └─→ [Get Price Recommendation]
  │   │
  │   ├─→ Upload Images (min 3)
  │   │
  │   └─→ Add Condition Notes
  │
  ├─→ Step 3: Review
  │   │
  │   ├─→ Preview Listing
  │   │
  │   └─→ Verify All Details
  │
  └─→ Publish Listing
      │
      └─→ Listing Live
          │
          └─→ Share on Social Media (optional)
```

**Key Features:**
- Auto-fill from certificate lookup
- Price recommendation based on market data
- Image validation (min size, format)
- Draft saving

---

### Flow 4: Seller - Bulk Management

```
START: Dashboard
  │
  ├─→ Click "Bulk Tools"
  │
  ├─→ Option 1: Export to CSV
  │   │
  │   └─→ Download CSV
  │       │
  │       └─→ Edit in Excel
  │           │
  │           └─→ Import Updated CSV
  │
  ├─→ Option 2: Bulk Price Update
  │   │
  │   ├─→ Select Listings
  │   │
  │   ├─→ Choose Update Method
  │   │   ├─→ Percentage (+10%, -5%)
  │   │   └─→ Fixed Amount (+$50)
  │   │
  │   └─→ Apply Changes
  │
  └─→ Option 3: Bulk Delete
      │
      └─→ Confirm Deletion
```

---

### Flow 5: Buyer Protection - Dispute Resolution

```
START: Receive Item
  │
  ├─→ Verify Certificate
  │   │
  │   ├─→ ✓ Matches → Happy
  │   │
  │   └─→ ✗ Issue Found
  │       │
  │       └─→ Open Dispute
  │           │
  │           ├─→ Fill Dispute Form
  │           │   ├─→ Issue Type
  │           │   ├─→ Description
  │           │   ├─→ Upload Photos
  │           │   └─→ Evidence
  │           │
  │           ├─→ Submit Dispute
  │           │
  │           ├─→ Seller Response (48h)
  │           │   │
  │           │   ├─→ Accept Resolution
  │           │   │
  │           │   └─→ Escalate to Admin
  │           │
  │           └─→ Admin Review
  │               │
  │               ├─→ Refund Approved
  │               │
  │               ├─→ Return Item
  │               │
  │               └─→ Keep Item
  │
  └─→ Case Closed
```

**Timeline:**
- Dispute opened: Day 0
- Seller response: Day 0-2
- Admin review: Day 2-5
- Resolution: Day 5-7

---

### Flow 6: Order Fulfillment (Seller)

```
START: Order Notification
  │
  ├─→ Review Order Details
  │
  ├─→ Prepare Item
  │   │
  │   ├─→ Verify Certificate
  │   │
  │   └─→ Package Securely
  │
  ├─→ Print Shipping Label
  │
  ├─→ Mark as Shipped
  │   │
  │   ├─→ Enter Tracking #
  │   │
  │   └─→ Upload Receipt
  │
  ├─→ Item Delivered
  │   │
  │   └─→ Payment Released
  │       │
  │       └─→ Funds in Account
  │
  └─→ Buyer Leaves Review
      │
      └─→ Seller Responds (optional)
```

---

## 🎯 Interaction Patterns

### Search & Filter

**Pattern: Progressive Disclosure**
1. Basic search bar (always visible)
2. Quick filters (price, grade) - inline
3. Advanced filters - sidebar/sheet
4. Filter chips - show active filters
5. Clear all - one-click reset

**States:**
- Empty state: "Start typing to search..."
- Loading: Skeleton cards
- No results: "Try adjusting filters"
- Results: Grid/list with pagination

### Product Cards

**Hover State:**
- Scale: 1.02
- Shadow: md → lg
- Show quick actions (Add to Cart, Wishlist)

**Click:**
- Navigate to detail page
- Track analytics (view)

**Mobile:**
- Tap to view detail
- Swipe for quick actions (optional)

### Forms

**Validation:**
- Real-time validation
- Error messages below field
- Success checkmark on valid
- Disable submit until valid

**Progressive Enhancement:**
- Auto-save drafts
- Auto-fill from browser
- Remember preferences

### Notifications

**Types:**
- Toast (temporary): Success, error, info
- Banner (persistent): Important updates
- Badge (count): Cart, messages, notifications

**Positioning:**
- Toast: Top-right (desktop), Top-center (mobile)
- Banner: Top of page
- Badge: Icon overlay

---

## 📱 Mobile-Specific Flows

### Bottom Navigation (Optional)

```
┌─────────────────────────┐
│                         │
│    [Main Content]       │
│                         │
│                         │
├─────────────────────────┤
│ [🏠] [🔍] [🛒] [👤]     │
│ Home Search Cart Profile│
└─────────────────────────┘
```

### Swipe Gestures

- **Card swipe left**: Quick add to cart
- **Card swipe right**: Add to wishlist
- **Pull to refresh**: Update listings
- **Swipe back**: Navigate back

### Mobile Filters

- **Sheet/Modal**: Full-screen overlay
- **Sticky Apply Button**: Always visible
- **Quick Filters**: Chips at top
- **Clear All**: Prominent button

---

## 🎨 Micro-Interactions

### Button States

```
Default → Hover → Active → Loading → Success
  │         │        │         │         │
  │         │        │         │         └─→ Checkmark + "Added!"
  │         │        │         └─→ Spinner
  │         │        └─→ Pressed (scale 0.98)
  │         └─→ Lighter background
  └─→ Base state
```

### Loading States

- **Skeleton**: Card-shaped placeholders
- **Spinner**: For actions (buttons)
- **Progress Bar**: For uploads
- **Pulse**: For live updates

### Transitions

- **Page transitions**: Fade (200ms)
- **Modal**: Slide up (300ms)
- **Dropdown**: Fade + slide (150ms)
- **Hover**: Scale + shadow (150ms)

---

## 🔔 Notification Flows

### Order Status Updates

```
Order Placed
  ↓ (Email + In-app)
Order Confirmed
  ↓ (In-app)
Order Shipped
  ↓ (Email + In-app + Tracking)
Order Delivered
  ↓ (Email + In-app)
Review Reminder
  ↓ (Email + In-app, 3 days)
```

### Seller Notifications

```
New Order
  ↓ (Email + In-app + Badge)
Payment Received
  ↓ (Email + In-app)
New Message
  ↓ (In-app + Badge)
Review Received
  ↓ (In-app)
```

---

## 🚨 Error States

### Network Error

```
┌─────────────────────────┐
│  ⚠️ Connection Error     │
│                         │
│  Unable to load data.   │
│                         │
│  [Retry]  [Go Back]    │
└─────────────────────────┘
```

### Not Found

```
┌─────────────────────────┐
│  🔍 Card Not Found       │
│                         │
│  This card doesn't      │
│  exist or was removed.  │
│                         │
│  [Browse Marketplace]   │
│  [Go Home]              │
└─────────────────────────┘
```

### Empty States

**Empty Cart:**
- Illustration
- "Your cart is empty"
- CTA: "Browse Marketplace"

**No Results:**
- Illustration
- "No cards found"
- Suggestions: "Try different filters"
- CTA: "Clear Filters"

---

*These flows serve as a guide for implementing user interactions and can be used for user testing.*




