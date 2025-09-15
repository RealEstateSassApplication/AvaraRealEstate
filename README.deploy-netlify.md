Netlify deployment notes

1) Install Netlify Next plugin (dev dependency):

```powershell
npm install --save-dev @netlify/plugin-nextjs
```

2) Add environment variables in Netlify site settings (Build & deploy -> Environment):
- `MONGODB_URI` (MongoDB connection string)
- `JWT_SECRET` (for auth tokens)
- `NEXT_PUBLIC_...` variables you expose to the client
 - S3 credentials, etc. as required by your app

3) Build settings (Netlify UI):
- Build command: `npm run build`
- Publish directory: leave default (plugin handles serving `.next`)

4) Testing locally with Netlify CLI:

```powershell
npm install -g netlify-cli
netlify dev
```

5) Linking & deploying:

```powershell
netlify login
netlify init   # or `netlify link`
netlify deploy --prod
```

Notes:
- `lib/db.ts` uses connection caching so Mongoose works with serverless functions.
- If you use any image upload or storage providers, add their keys to Netlify env vars.
- If functions hit connection limits on your DB, consider using a serverless-friendly DB tier or connection pooling.
