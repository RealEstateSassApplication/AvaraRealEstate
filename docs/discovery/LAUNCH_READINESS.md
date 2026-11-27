# Public launch readiness — mobile UX and functional checks
## Implemented
- Responsive compact header, scrollable mobile menu, accessible 44px search controls, full-height filter sheet with independently scrollable content and persistent apply/reset controls.
- URL-authoritative listing query and page, validated filter inputs, abort superseded searches, real list mode, error vs empty states and retry.
- User-private saved IDs endpoint, explicit idempotent save/remove endpoint, login routing, active-only saved collection and working remove; old POST kept for compatibility.
- Responsive property photo gallery and booking card; removed unsupported Superhost, fixed join year, blanket protection/fee and dead report claims. No contact details in page HTML; public structured data omits street.
- Journal layout consistent with brand and visible error/retry; bounded public blog/property parameters.
- Retain ivory, charcoal and restrained forest/brass. No fabricated listings or reviews.
## Automated checks
- Existing CI lint/typecheck/build and SQL/calculator jobs.
- New Playwright CI at 360, 390, 768, 1440 widths, public routes, navigation, filters, page reload/back, favorites and gallery controls on cards, empty/error state. Uses explicitly mocked API fixtures; not live Mongo/Supabase or real device testing.
- Listing query tests: node --test tests/discovery-listing-query.cjs.
## Still required before launch
- Verify latest CI and review browser failure traces. Test actual mobile Safari/Android Chrome, accessibility with screen readers, keyboard/focus in dialogs, slow networks, authenticated owner/admin, live Mongo/Supabase configuration and RLS, listing detail gallery with real stored images, applications/bookings/enquiries, image licensing and image upload, backups/security audit, analytics, SEO and deployment. No production data changes or deployment in this PR.
- Expand CMS media and new area CRUD, business/agent directories, consented lead tracking, sponsored placements and source-backed market intelligence. Property OS remains a GitHub link.

## Browser runner incident
The first browser job failed before running tests because ubuntu-latest resolved to Ubuntu 26.04, unsupported by the pinned Playwright 1.51.1. The job now pins Ubuntu 24.04, uses Node 22, and installs Playwright in RUNNER_TEMP with NODE_PATH rather than altering application node_modules. The browser suite still gates the check; failure traces are retained. Added 320px coverage, deterministic third-party image blocking, branded 404 and safe login return tests. Nine private API routes now explicitly render at request time. The build log also reported dependency vulnerabilities; review a separate clean-lockfile audit before release. No claim that the fixed browser job has passed until GitHub reports it.
