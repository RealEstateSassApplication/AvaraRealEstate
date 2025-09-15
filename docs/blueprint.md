# Avara SL — MVP Blueprint

This document consolidates the MVP blueprint for Avara SL: architecture, models, API routes, services, frontend structure, admin dashboard, payments, WhatsApp integration, and deployment flow.

## 1. High-level Overview
- Goal: Single platform for property rentals, short-term bookings, and property sales targeting Sri Lanka.
- Mobile-first PWA; WhatsApp-first communications; currency: LKR.
- Core roles: Guest, Tenant, Host, Admin, Super-admin (optional).

## 2. Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, TypeScript
- Backend: Next.js API routes + Node.js + Mongoose
- DB: MongoDB Atlas
- Auth: NextAuth.js or JWT + OTP (SMS/WhatsApp)
- Storage: AWS S3 (signed uploads) / Cloudflare R2 alternative
- Payments: PayHere (LKR)
- Messaging: WhatsApp Business API or Twilio WhatsApp + SMS fallback

## 3. Project Structure (recommended)
```
app/                # Next.js App Router
components/         # UI components
lib/                # db.ts, auth.ts, s3.ts
models/             # Mongoose models
services/           # Business logic layer
pages/api or app/api # API routes
public/
docs/               # documentation
```

## 4. Key Models
- User: name, email, phone, passwordHash, role, profilePhoto, verified, listings, favorites, prefs
- Property: title, description, owner, type, purpose, status, price, currency, rentFrequency, specs, images, address, amenities, availability, calendar, pricing, policies, ratings
- Booking: property, user, host, start/end, nights, totalAmount, status, paymentStatus, guest info
- Transaction: booking, property, from, to, amount, currency, provider, providerTransactionId, status
- Additional: Review, Conversation/Message, MaintenanceRequest, VisitRequest, SearchHistory, AdminAction

## 5. API Surface (minimal MVP)
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, OTP endpoints
- Properties: `GET /api/properties`, `GET /api/properties/:id`, `POST /api/properties`, `PUT /api/properties/:id`, `DELETE /api/properties/:id`
- Bookings: `POST /api/bookings`, `GET /api/bookings/:id`, `GET /api/host/bookings`, `POST /api/bookings/check-availability`
- Payments: `POST /api/payments/create-intent`, `POST /api/payments/webhook`
- Messaging: `POST /api/notifications/whatsapp`, webhook endpoints for inbound messages
- Admin: `GET /api/admin/properties`, `POST /api/admin/properties/:id/status`

## 6. Filters & Search
- Frontend: debounced inputs → backend query
- Backend: Compose MongoDB query supporting purpose, type, price ranges, bedrooms, amenities, `$geoNear` for lat/lng+radius, and text search on `title`/`description`.

Example query params:
```
?purpose=rent&minPrice=25000&maxPrice=120000&type=apartment&bedrooms=2&lat=6.9271&lng=79.8612&radiusKm=10&amenities=parking,garden
```

## 7. Services / Business Logic
- `propertyService`: create/update/search, slugging, geolocation helpers
- `bookingService`: availability checking, double-book prevention, create booking with MongoDB transactions (sessions)
- `paymentService`: integrate PayHere SDKs, create payment intent, verify webhooks
- `notificationService`: WhatsApp & SMS, OTP management

## 8. Booking Flow (MVP)
1. Client validates dates & requests availability check
2. Backend runs availability and returns price
3. Create Booking (status: pending) + payment intent
4. On payment success webhook: mark Booking confirmed/paid, create Transaction, block calendar dates

## 9. Media & Uploads
- Use signed S3 uploads from frontend; store object URLs in `Property.images`.
- Optionally generate thumbnails via Lambda/Cloudinary or on-upload processing.

## 10. Payments
- PayHere for LKR local flows (sandbox for testing)
- (Optional) support for international card processors
- Webhooks to update booking and transaction records; signature verification required

## 11. WhatsApp & SMS
- OTP verification and booking confirmations via WhatsApp templates
- Twilio or WhatsApp Business API for outbound/inbound messages
- SMS fallback using Twilio or local SMS gateways

## 12. Admin Dashboard
- Moderation queue, listing approvals, user management, transaction logs, platform metrics

## 13. Deployment Architecture
- Frontend: Netlify or Vercel (Next.js)
- Backend: Render, Railway, or a Node host for server-side APIs and webhooks
- Database: MongoDB Atlas
- Object storage: S3 or R2
- CI: GitHub Actions building + deploying to Netlify/Render

## 14. Environment Variables
See `.env.example` in project root for required variables.

## 15. MVP Roadmap (recommended)
- Week 0–2: Setup, DB + auth, user profiles, basic listing + filters
- Week 3–4: Host dashboard, image upload, booking model + calendar, payments sandbox
- Week 5–6: Messaging (WhatsApp), visit scheduling, admin dashboard
- Week 7–8: Short-term booking polish, reviews, UX improvements

## 16. Next Steps (what I can implement now)
- Review and align Mongoose models (ensure indexes + types)
- Add service skeletons (`services/*`) with core methods
- Scaffold API routes for properties, bookings, payments, auth
- Add `.env.example` and `DEPLOYMENT.md` notes

---
For more details or to start implementing a specific module, pick an item from the next steps.
