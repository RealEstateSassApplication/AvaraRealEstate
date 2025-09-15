# Deployment Notes — Avara SL

This document contains recommended deployment steps for the frontend and backend, CI/CD, and provider setup (PayHere, WhatsApp).

## Frontend (Netlify or Vercel)
- Build command: `npm run build`
- Publish directory: `.next` (Netlify) or default for Vercel
- Environment variables: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_URL`, `NODE_ENV` and any public keys

## Backend (Render / Railway / Heroku)
- Deploy the Node backend (if using separate server) with environment variables from `.env`
- Ensure webhooks are reachable with a public HTTPS endpoint

## MongoDB Atlas
- Create a cluster and a user; whitelist Render/Netlify IPs if required
- Copy `MONGODB_URI` into environment variables

## AWS S3
- Create bucket, configure CORS for signed uploads, create IAM user with `s3:PutObject` permissions

## PayHere (Sri Lanka)
- Setup sandbox account and merchant credentials
- Configure webhook URL in PayHere dashboard to `https://your-backend.example.com/api/payments/webhook`
- Verify sandbox transactions and signature verification

## WhatsApp Business API / Twilio
- For Twilio, create a WhatsApp sender and configure webhook for incoming messages
- Template messages require approval when using WhatsApp Business API

## GitHub Actions (sample)
- Use two workflows: `ci-frontend.yml` and `ci-backend.yml` to build and deploy to Netlify/Render

## Checklist
- [ ] Set environment variables in hosting platforms
- [ ] Configure webhook endpoints
- [ ] Setup SSL (HTTPS)
- [ ] Run DB migrations / ensure indexes
- [ ] Test payment flows in sandbox
