# 7th Rank

> *One Square From Promotion*

Premium chess-inspired streetwear and apparel. The website **is** the chess board.

---

## What This Is

7th Rank is a luxury chess fandom brand. Every element of the site mirrors the chess board — 8 ranks, 8 files, alternating squares. Navigation through the site moves like a pawn advancing toward promotion.

## Tech Stack

- **HTML/CSS/JS** — Vanilla, no framework
- **GSAP 3** — Entrance animations and scroll effects (CDN)
- **CSS Scroll Snap** — Native rank-to-rank navigation
- **Google Fonts** — Bebas Neue, Playfair Display, Inter

## Repository Structure

```
├── website/          ← Deployable site (set as root in hosting)
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
├── research/         ← Design strategy and UX references
├── DEVELOPER.md      ← Full technical documentation
└── .github/
    └── workflows/
        └── deploy.yml
```

## Getting Started

No build step required. Open `website/index.html` in a browser, or serve with any static file server:

```bash
npx serve website
# or
python -m http.server 8080 --directory website
```

## Deployment

The site deploys from the `website/` subdirectory. See [DEVELOPER.md](DEVELOPER.md) for full deployment instructions.

**Recommended:** Vercel — connect this repo, set root to `website/`, deploy.

## Documentation

Full developer documentation is in [DEVELOPER.md](DEVELOPER.md), covering:

- Architecture and state machine
- Adding collections and product lines
- Product image naming convention
- Design system (colors, typography)
- SEO schema setup
- Shopify integration guide
- Contact form integration options
- GitHub workflow and branch strategy

---

&copy; 2026 7th Rank. All rights reserved.
