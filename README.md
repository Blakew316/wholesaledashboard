# Wholesale Payments — Company Website

A redesigned marketing website for Wholesale Payments, Inc. — zero-fee payment
processing and merchant services since 2007.

## Design

- **Typography** — Apple-style system font stack (SF Pro on Apple devices, with
  Segoe UI / Roboto fallbacks), large tracking-tight headlines, generous whitespace.
- **Color** — hues drawn from the Wholesale Payments logo: azure blue `#077AE8`,
  deep blue `#0554A8`, and soft green `#80CD86`, on white and deep-navy grounds.
- **Animation** — scroll-triggered reveals, animated stat counters, a floating
  3D payment card with pointer tilt, aurora/parallax orbs, an industries marquee,
  a fee-comparison bar animation, and a frosted-glass nav. All animations respect
  `prefers-reduced-motion`.

## Structure

```
index.html        # single-page site: hero, zero-fee, solutions, industries,
                  # how-it-works, about, CTA, footer
css/styles.css    # design system + all styling and keyframe animations
js/main.js        # nav state, reveals, counters, tilt, parallax, mobile menu
assets/           # SVG logo + favicon
```

## Run locally

No build step — it's a static site:

```
python3 -m http.server 8080
# open http://localhost:8080
```
