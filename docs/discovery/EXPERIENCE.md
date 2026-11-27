# Discovery experience: stage 1 implementation

## Implemented
- Server-rendered discovery homepage and neighbourhood directory with stable, statically generated area detail routes.
- Search by purpose, city, property type and maximum listed LKR amount; no implicit default budget.
- Real active-listing feed with loading, empty, failure and retry states.
- Five editorial viewing checklists; no invented prices, measured local facts or amenity rankings.
- Account-optional discovery and budget calculator, existing sale/rent/stay links preserved.
- Property Management OS as a secondary GitHub link only; old /property-os redirects to the repository.
- Route-specific canonicals for new pages and sitemap entries only for canonical paths, not arbitrary filter query URLs.

## Review checklist
1. npm ci; npm run lint; npm run typecheck; npm run build.
2. Verify mobile/desktop navigation and hero search: city Nugegoda + rent + apartment + max 65000 produces corresponding URL. Clear budget omits maxPrice; change purpose clears previous budget.
3. Listing API: with fixtures check loading, success, no matching records, server failure and retry; no fixtures in production.
4. Open /explore and all five child URLs; invalid slug returns 404; verify browse links, calculator and keyboard navigation.
5. Verify /property-os redirects to public GitHub repo; check sitemap excludes that redirect and query URLs. Confirm existing owner/admin operations still work.
6. Visual browser, accessibility and user acceptance checks remain required. Hero reuses prior external illustrative image; obtain approved licensed local imagery before launch.

## Deferred
Sourced market research, real location photography, guide editorial review, CMS-managed content, Supabase migration, consented enquiries and monetization. No database or production migration in this PR.
