# Avara Intelligence — property planning tools
## Implemented routes
- /tools — public directory.
- /tools/living-cost — monthly living budget, existing calculator.
- /tools/mortgage — fixed-rate payment, interest, total payments and annual balance.
- /tools/rent-vs-buy — nominal cash-cost comparison with an assumed sale at the selected horizon.
- /tools/land-converter — square feet, square metres, perches, acres and hectares.

All are account-optional and client-side. Values are not stored or transmitted by calculator code; no new dependencies, backend or financial API. Inputs are illustrative, not live rates or market prices.

## Math
Mortgage: monthly rate = nominal annual percentage / 1200; monthly payments use the standard fully amortizing formula with a zero-rate branch. Final payment adjusts for floating-point residual; displayed amounts round to LKR. Assumes constant rate and no fees/prepayments.

Rent vs buy: monthly rent rises once annually. Buyer cash outflows = down payment + purchase fees + mortgage payments + recurring owner costs; net cost subtracts sale price after selling fee and remaining loan balance. Annual appreciation compounds and can be negative. No cash opportunity cost, investment return, discounted cash flows, taxes beyond supplied fees, rental deposits or maintenance inflation. No claim that the lower-cost scenario is a better investment.

Land: 1 square foot = 0.09290304 square metres; 1 perch = 272.25 square feet; 1 acre = 160 perches; hectare = 10,000 square metres. Values are display-rounded; surveyed legal areas must be independently verified.

## Release checks
Run npm ci, npm run lint, npm run typecheck, npm run build, node --test tests/discovery-calculations.cjs. The dedicated CI job runs numerical regression tests including zero interest, full cash purchase, stale/invalid inputs, sale before and after mortgage maturity, and land conversions. Test all four routes on desktop and mobile; enter zero, empty, negative, out-of-range and fractional year inputs; check keyboard input labels, overflow and table layouts; confirm navigation and sitemap links. Browser testing remains required.

This does not complete market intelligence: sourced neighbourhood prices, transaction records, source provenance and sample-size methodology are separate future milestones. CMS PR #35 can merge independently; no CMS, MongoDB or Property OS business logic changes in this branch.
