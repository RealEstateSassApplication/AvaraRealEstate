# Avara Marketplace + Property Management OS

**Updated:** 2026-10-08  
**Status:** Shared product direction; integrations listed below are **planned** unless explicitly called implemented.

## What Avara is becoming

**Avara is the property discovery, trust and transaction experience.** [Property Management OS](https://github.com/RealEstateSassApplication/property-management-OS) is the independent B2B system used by operators to run properties, report to owners, coordinate staff, handle lease accounting and keep auditable evidence.

This is **not** an ikman/classifieds clone and is **not** just an Airbnb clone. The proposed long-term advantage comes from the combination of:

- A beautiful and trustworthy discovery/transaction experience (Avara).
- Transparent owner reporting with source evidence, work orders and approvals (Property OS).
- Easy migration from existing spreadsheets and property tools (Switch Kit).
- Safe, human-approved operational automation (Property OS agent controls).
- Optional tenant/guest acquisition through Avara for operators who already use Property OS.

Read the full strategy, competitor positioning, milestones and acceptance criteria in [Property OS product strategy and roadmap](https://github.com/RealEstateSassApplication/property-management-OS/blob/main/docs/product-strategy-and-roadmap.md). The linked plan is being proposed in [Property OS PR #18](https://github.com/RealEstateSassApplication/property-management-OS/pull/18); until merged, use the [review branch version](https://github.com/RealEstateSassApplication/property-management-OS/blob/feat/avara-onboarding-preflight-20261008/docs/product-strategy-and-roadmap.md).

## Product boundaries: do not duplicate authority

| Concept | Source of truth | Integration policy |
| --- | --- | --- |
| Public listing, images, location discovery, inquiries | Avara | User-facing marketplace workflow |
| Long-term units, owners, tenancies, leases, financial ledger and statements | Property OS | API-mediated, permission-scoped |
| Maintenance, inspection evidence, vendor costs and approval records | Property OS | Do not reimplement separate ledgers in Avara |
| Existing Avara short-stay bookings, payment callbacks and booking calendar | Avara **for now** | Remain separate until a robust hospitality reservation domain is approved |
| Future short-stay reservation inventory and operational accounting | To be designed under dedicated hospitality module | Must choose one authoritative store before activation |
| Mobile inspections and field work | Property OS API + native app | Offline drafts cannot overwrite authorized backend records |

**No database joins or dual writes across MongoDB and PostgreSQL.** Add tenant/org mapping and external IDs in an integration adapter. Require signed/idempotent events, scoped authorization, deduplication, observable retries and a reconciliation view. Avara customers may use the marketplace without Property OS; Property OS customers may use the OS without Avara.

## Immediate prerequisites before real-money bookings

Review the present Avara flows against the following identified risks; treat them as release blockers until fixed and tested:

1. Property booking availability endpoint reads check-in/out field names different from the Booking model; validate calendar results and blocked dates.
2. Checkout UI and server pricing formulas diverge (service fee, property-specific cleaning fee). One server-authoritative quote must back display and payment.
3. Pending booking holds need expiration and safe release semantics; refund/cancellation must be supported before payment launch.
4. Host booking API/UI fields must align with the Booking model; calculate occupancy from occupied/available nights, not bookings/booking count.
5. Remove static host claims, joined dates and protection promises that have no verified business backing.
6. Regression-test unauthorized operations, forged/repeated payment callbacks, concurrent reservations, date/timezone boundaries, refunds and cancellations.

A future integration is **not** a workaround for unresolved marketplace booking correctness defects. Fix them before promoting the product.

## Milestones

- **Current:** Property OS onboarding CSV preview (no mutation), roadmap and guardrails. Avara's own booking/reliability review continues independently.
- **Next:** Owner Proofbook evidence exports, fully authorized owner access and financial reconciliation.
- **Then:** Opt-in Avara-to-Property-OS lead/application conversion with manager review, event audit and collision/replay tests.
- **Later:** Hospitality PMS and channel integrations based on proven customer demand, separate from long-term leasing.
- **Commercial gate:** 15–20 manager discovery interviews, three paid/contracted pilots, and quantifiable reductions in manual administration and owner support effort.

## Messaging

**For guests and renters:** Discover better-vetted properties with clear terms, reliable booking and support. We must not imply guarantees we do not operationally provide.

**For property managers:** Operate properties with evidence, auditable finances and simpler collaboration with owners. Marketplace distribution is an opt-in advantage, not an obligation.

**For owners:** See what happened to the property, who approved work, which payments and expenses occurred, and where the supporting evidence lives.

## Engineering ownership and handoff

- Marketplace teams own consumer UX, listings, application intake, marketplace booking security and conversion.
- Property OS teams own long-term tenancy, owner accounting, maintenance, inspections, identity-scoped portals and approvals.
- Integration teams own versioned contracts, authorization, event/idempotency transport, mapping, reconciliation, privacy and audit.
- Rollout requires CI, migration compatibility, incident/backout procedures, full staging and pilot validation. **No claim of bug-free production readiness based on a successful build alone.**
