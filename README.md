# Wholesale Payments — Sales Dashboard (Redesign)

A ground-up redesign of `sales.wholesalepayments.org`, rebuilt as a fully static,
dependency-free site from a capture of the production dashboard. Every page, table
row, dollar figure, and merchant record from the reference capture is preserved.

## Design

- **Typography** — Apple-style system stack (SF Pro on Apple hardware, Segoe UI /
  Roboto elsewhere): tight-tracked navy headlines, tabular numerals for money.
- **Color** — drawn from the Wholesale Payments logo and used as *subtle hues only*:
  navy `#00115F` (wordmark), azure `#0095E4` and greens `#00C878`/`#50E878` (icon bars),
  gray `#AAAFB5`. The hues appear in hairline gradients, badges, chart strokes,
  meters, and whisper-quiet background glows — never as large blocks of color.
- **Animation** — glass top bar, staggered card reveals, count-up KPIs, SVG charts
  that draw in (bar-grow, line-draw, donut sweep), animated ratio meters, dropdown
  and tab transitions. All animation respects `prefers-reduced-motion`.

## Pages

```
index.html                     Sales Dashboard (portfolio, activity chart, widgets)
Rankings.html                  Manager & sales-rep leaderboards
merchants/search.html          Merchant search with live filtering
merchants/detail/<MID>.html    20 merchant detail pages (stats, charts, contact)
payverification/detail.html    Kaching — pay detail, earnings trend, income mix
payverification/roster.html    Kaching — pay verification roster
reports/…                      Nonprocessing, Volume Difference, Gain/Loss,
                               Pended Deals, Avg Merchant Volume, Threshold,
                               Weekly Processing, HPAR, Car Contest 2025
```

## Stack

No build step, no external dependencies, no CDNs. Charts are hand-rolled SVG
(`assets/js/wpi.js`) fed by `data-chart` JSON attributes. Tables sort client-side;
search/filter controls filter rows live.

```
python3 -m http.server 8080   # then open http://localhost:8080
```
