# Features Research: Local Tourism Voucher Platform

## Table Stakes (Must have — users expect these)

### Authentication & User Management
- OTP phone login (standard in Vietnam apps)
- Email/password login (admin/vendor)
- JWT with refresh token rotation
- Profile management (name, avatar, phone)
- Role-based access (tourist, vendor_owner, admin)

### Service Discovery
- Category browsing (ẩm thực, lưu trú, spa, xe điện, giải trí)
- Service detail pages (photos, description, price, reviews)
- Vendor profiles with rating aggregation
- Basic search and filtering (category, price range)

### Ordering & Voucher System
- Add to cart / direct purchase flow
- Payment gateway integration (redirect-based)
- Voucher generation after successful payment
- QR code display on voucher
- Voucher status tracking (CREATED → PAID → REDEEMED → COMPLETED → SETTLED)
- Order history

### Vendor Operations
- Receive order notifications (push)
- QR scanning to redeem vouchers
- Confirm service completion
- View earnings and settlement history
- Basic service/menu CRUD

### Admin Dashboard
- Vendor approval workflow (pending → active)
- Order and payment monitoring
- Settlement/reconciliation management
- Content management (news, events)
- Revenue reporting

### Payments & Settlement
- Multiple payment gateway support
- Webhook processing for payment confirmation
- Commission calculation (vendor pays 8%, tourist saves 5%, platform keeps 3%)
- Periodic settlement (every 3 days) or instant withdrawal
- Refund processing for unused vouchers

**Complexity: HIGH** — Voucher state machine + payment integration + settlement is the hardest part.

## Differentiators (Competitive advantages)

### AI Itinerary Generator
- Input: duration, budget, preferences, group type
- Output: personalized day-by-day itinerary with mapped services
- "Book All" or pick individual services
- **Complexity: MEDIUM** — LLM API call with structured output

### Combo/Bundle System
- Vendor creates multi-service packages at discounted price
- "Buy more, save more" incentive
- Cross-vendor combos (future)
- **Complexity: MEDIUM** — Additional order logic

### Local Content Hub
- News, events, festivals
- Weather information (cached from external API)
- Seasonal recommendations
- **Complexity: LOW** — Basic CMS

### Bi-directional QR
- Vendor scans tourist's QR (standard)
- Tourist scans vendor's fixed QR at counter (flexibility for busy shops)
- **Complexity: LOW** — Two scan modes, same API

## Anti-Features (Deliberately NOT building)

| Feature | Why Not |
|---------|---------|
| Real-time chat | High complexity, not core to voucher model, vendors prefer phone calls |
| Social features (following, sharing) | Not a social platform, adds UI clutter |
| Dynamic pricing | Over-complicates vendor onboarding, undermines price transparency |
| Auction/bidding | Against the transparent pricing value proposition |
| Multi-city support in v1 | Focus on Sầm Sơn first, validate model before expanding |
| Vendor self-registration | Quality control requires manual onboarding |

## Feature Dependencies

```
Auth ─────────────────────────────┐
                                  ↓
Vendor/Service CRUD ──→ Service Discovery ──→ Ordering ──→ Voucher System
                                                ↓              ↓
                                           Payment Int.   QR Redemption
                                                ↓              ↓
                                           Settlement ←── Completion
                                                
Content (news/events/weather) — Independent
AI Itinerary — Depends on Service Discovery
Combo System — Depends on Service CRUD + Ordering
Notifications — Cross-cutting, depends on most services
Admin Dashboard — Depends on all data models
```

---
*Researched: 2026-03-22*
