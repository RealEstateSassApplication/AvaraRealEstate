# Avara SL — MVP Blueprint

This document summarizes the Avara SL MVP: architecture, models, APIs, deployment notes, and next steps.

(Condensed blueprint...) 

## Tech stack
- Frontend: Next.js (App Router), React, Tailwind, TypeScript
- Backend: Next.js API routes + Mongoose
- DB: MongoDB Atlas
- File storage: AWS S3
- Payments: PayHere (LKR)
- Messaging: WhatsApp Business API + Twilio SMS fallback

## Project structure
(see project root for file layout)

## Key models
- User, Property, Booking, Transaction, Review, Message, MaintenanceRequest

## APIs
- Auth: register, login, me, logout
- Properties: CRUD, filters
- Bookings: create, list, availability
- Payments: create intent, webhooks
- Admin: stats, moderation
- Uploads: signed URL endpoint

## Deployment
- Frontend: Netlify or Vercel (Next.js)
- Backend: Render or Railway for serverless Node API (or same Next app on Vercel)
- MongoDB: Atlas
- CI: GitHub Actions → preview & prod deployments

## Environment variables
- See list in project README

## Roadmap (first 6 weeks)
- Week 0–2: setup, auth, listings CRUD
- Week 3–4: host dashboard, images, booking flow
- Week 5–6: payments, messaging, admin

## Notes
- Ensure transactional booking creation with MongoDB sessions
- Handle webhooks idempotently
- WhatsApp templates need approval

