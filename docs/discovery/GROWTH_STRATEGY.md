# Avara discovery and growth strategy
## Positioning
Sri Lanka first: property discovery + neighbourhood decisions + transparent calculators + editorial knowledge + trusted supply. Do not compete only on number of listings. Build repeat-use assets and first-party demand signals before expanding globally.

## Shipped in this branch
Five server-rendered guide pages and guide hub, About/editorial approach, original government references where relevant, direct answer and practical checklist per guide. Published journal now server-renders, respects published status, has individual metadata and real search/pagination. Server-rendering no longer increments views on each page read; replace view metric with consent-aware event collection rather than count crawler visits. Social preview and favicon, Organization/WebSite + Article/Breadcrumb schema, private-route noindex, OAI-SearchBot public access, sitemap refresh with honest dates, internal links, browser crawlability test. No new database requirements for guides.

## Market entry sequence
1. Colombo metro: five existing neighbourhoods; recruit independent agents and developers, validate demand via search queries and actual enquiries. Free tools plus original local checklists.
2. Western Province then Kandy/Galle/other cities: only add a location when unique data, useful local guidance, approved photography, actual listings or reputable sources exist. Create 3 language editions (English, Sinhala, Tamil) with human review and hreflang after genuinely translated pages exist.
3. Diaspora: buyer research guides, independent professional referrals, remote viewing and verified agency profiles; verify country-specific ownership/legal claims with local experts.
4. Expand into one adjacent market at a time after repeatable economics; stable country IDs, locale, currency, units, region hierarchy and jurisdiction-specific content. Keep existing Sri Lanka URLs; use new country paths or separate domains only after international architecture decision and URL migration planning.

## Keyword map (hypotheses, not measured volume)
- /listings: property Sri Lanka; transactional. Use curated canonical category pages only when useful inventory and context exist.
- /explore: neighbourhoods in Sri Lanka; comparison and informational.
- /guides/buying-land-sri-lanka: buying land in Sri Lanka checklist.
- /guides/renting-home-sri-lanka: renting a house in Sri Lanka checklist.
- /tools/mortgage: mortgage calculator Sri Lanka; /guides/mortgage-planning-sri-lanka supports the tool with separate educational intent.
- /tools/land-converter: land area converter Sri Lanka; /guides/perch-acre-square-feet answers the unit question.
- /guides/understanding-property-prices-sri-lanka: how to compare property prices.
- /tools/living-cost: cost of living calculator Sri Lanka; no invented average costs.

## Commercial funnel
Search / AI citations -> useful guide or calculator -> browse relevant properties or businesses -> explicit opt-in enquiry -> response tracking -> qualified lead or subscription. Free profiles to establish supply, clearly labeled sponsored placements, agency tools, lead fees only with consent and verified quality. Avoid ads that undermine premium experience. Measure unique qualified enquiries, response times, conversion, revenue per lead and repeat visits, not vanity page count.

## Data moat
Next: location/agency/developer/project entities in a normalized data model with provenance, source URL, coverage, observation date, review state, rights, and correction workflow. First-party listing history, consented lead outcomes, independent verified data partnerships, CBSL indicators scoped to published geography and date. Separate asking prices from transactions; show sample size, methodology and freshness. No copying competitor listings without permission. No automatically published thin location pages.

## SEO / GEO / AEO
Google: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
OpenAI crawler access: https://developers.openai.com/api/docs/bots
- Unique, helpful HTML, clear entity relationships and citations, visible answer blocks, real dates, no unsupported guarantees or fake reviews. Schema mirrors visible content; no special AI markup guarantees inclusion.
- Google Search Console and Bing Webmaster Tools: verify ownership, submit sitemap, inspect canonical/index status, identify real queries and content gaps. Check robots/CDN access on production, not just repo.
- Track 30 repeatable prompts twice monthly (e.g. "what to check before buying land in Sri Lanka", "how many square feet in 10 perches", "how to compare rents in Colombo"). Record date, engine, citation URL, correct facts, competitors, no-citation result. No fabricated AI rankings.
- Earn links through locally useful calculators, research releases, real expert contributors and disclosed partnerships. No paid followed links, mass AI spam or doorway pages.
- Measure monthly: index coverage, impressions/clicks, non-brand query clusters, qualified enquiries, conversion, organic/AI referral traffic, Core Web Vitals. Baselines unknown until analytics connected.
- Rollout gates: CI/browser checks, production metadata/sitemap/robots validation, actual DB/RLS tests, source/editorial review, dependency audit, search-console verification. No ranking claims until measured.
