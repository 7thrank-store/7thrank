# 7th Rank — Developer Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [File Structure](#2-file-structure)
3. [Architecture: The Chess Board UX](#3-architecture-the-chess-board-ux)
4. [Application State Machine](#4-application-state-machine)
5. [Navigation Flow & Scroll Bypass](#5-navigation-flow--scroll-bypass)
6. [Collections & Product Data](#6-collections--product-data)
7. [Product Image Convention](#7-product-image-convention)
8. [Adding New Collections & Lines](#8-adding-new-collections--lines)
9. [Design System](#9-design-system)
10. [SEO Architecture](#10-seo-architecture)
11. [Animations](#11-animations)
12. [Cart & Checkout](#12-cart--checkout)
13. [Shopify Integration (Next Step)](#13-shopify-integration-next-step)
14. [Contact Form Integration](#14-contact-form-integration)
15. [Deployment](#15-deployment)
16. [GitHub Workflow](#16-github-workflow)
17. [Known Constraints & Decisions](#17-known-constraints--decisions)

---

## 1. Project Overview

**7th Rank** is a luxury chess fandom and expression apparel brand. The entire website *is* a chess board — each section of the page represents a rank (row) of a chess board, and navigation through the site mirrors a pawn advancing toward promotion.

**Design paradigm reference:** [jeskojets.com](https://jeskojets.com) — luxury minimalist, scroll-driven narrative, rich without being heavy.

**Tagline:** *One Square From Promotion*

---

## 2. File Structure

```
7th-rank-website/
├── website/                          # Deployable site root
│   ├── index.html                    # Single-page application entry point
│   ├── css/
│   │   └── style.css                 # All styles (1,900+ lines)
│   ├── js/
│   │   └── main.js                   # Application logic (1,300+ lines)
│   └── images/
│       ├── logo.svg                  # Brand logo (fill="black", CSS inverted for white)
│       ├── placeholder-product.svg   # Fallback for missing product images
│       ├── og-image.jpg              # Open Graph social share image (TO CREATE: 1200×630px)
│       └── products/                 # Product imagery
│           └── pieces_[Line].[Piece].[ColorHex].jpg
├── research/
│   ├── jesko_jets_analysis.md        # UX paradigm reference analysis
│   ├── design_strategy.md            # Full design strategy document
│   └── seo_strategy.md               # SEO and AI search strategy
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions deployment workflow
├── .gitignore
└── DEVELOPER.md                      # This file
```

---

## 3. Architecture: The Chess Board UX

The site uses a **single scrollable column** where each section snaps to full viewport height, representing chess ranks 1–8.

### Layout Mapping

| Rank | Section ID   | Height    | Role                                      |
|------|-------------|-----------|-------------------------------------------|
| 1+2  | `#landing`  | 100vh     | Brand name (Rank 1) + Navigation (Rank 2) |
| 3    | `#rank-3`   | 100vh     | Collections carousel                      |
| 4    | `#rank-4`   | 100vh     | Garment lines (shopping mode only)        |
| 5    | `#rank-5`   | 100vh     | Piece selection (shopping mode only)      |
| 6    | `#rank-6`   | 100vh     | Colorway + customization (shopping only)  |
| 7    | `#rank-7`   | 100vh     | Contact (default) OR Checkout (shopping)  |
| 8    | `#rank-8`   | 100vh     | Confirmation (contact sent / order placed)|

### Square Grid

Each rank is an 8-column CSS grid (mirroring chess files a–h). Colors alternate:
- **Light squares:** `#F0D9B5` (chess ivory)
- **Dark squares:** `#1C1410` (luxury ebony)

The square pattern matches real chess board orientation (a1 = dark).

### Key CSS

```css
/* Scroll container */
.chess-board {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

/* Each rank snaps */
.rank-full, .landing-view {
  scroll-snap-align: start;
}
```

---

## 4. Application State Machine

All application state is stored in the `STATE` object in `js/main.js`:

```javascript
var STATE = {
  mode:               'default',   // 'default' | 'shopping'
  currentSection:     'landing',   // active section ID
  selectedCollection: null,        // collection object from COLLECTIONS[]
  selectedLine:       null,        // line object from collection.lines[]
  selectedPiece:      null,        // piece key: 'P' | 'B' | 'N' | 'R' | 'Q' | 'K'
  selectedColorway:   null,        // colorway object from COLORWAYS[]
  selectedSize:       null,        // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  cart:               [],          // array of cart item objects
  wishlist:           [],          // array of wishlist item objects
  navigatingFrom:     null,        // 'queen' | 'king' (pawn animation)
  carouselOffset:     0,           // current carousel position (index)
  isScrolling:        false,       // scroll lock flag
  isBypassing:        false        // bypass animation in progress
};
```

### Mode Transitions

```
Initial load:          mode = 'default'
Queen click:           mode = 'shopping' → navigate to rank-3
King click:            mode = 'default'  → navigate to rank-7 (contact)
Collection selected:   mode = 'shopping' → navigate to rank-4
"Continue Shopping":   mode = 'shopping' → navigate to rank-3
Contact form submit:   mode = 'default'  → navigate to rank-8 (contact confirm)
Order placed:          mode = 'shopping' → navigate to rank-8 (order confirm)
```

---

## 5. Navigation Flow & Scroll Bypass

### Default Mode (no product in progress)

```
landing → rank-3 → [BYPASS: flash 4→5→6 at 180ms each] → rank-7 (contact)
                                                               ↑
landing ← rank-3 ← [BYPASS: flash 6→5→4 at 180ms each] ← rank-7
```

The bypass prevents confusion — ranks 4–6 are "shopping territory" only.

### Shopping Mode (product selection in progress)

```
landing → rank-3 → rank-4 → rank-5 → rank-6 → rank-7 (checkout) → rank-8 (confirm)
```

Reverse scrolling goes back through each rank normally.

### Bypass Implementation (`bypassMiddleRanks`)

```javascript
function bypassMiddleRanks(direction, callback) {
  // 1. Disable scroll-snap temporarily
  board.style.scrollSnapType = 'none';
  // 2. Flash through each middle rank at 180ms
  // 3. Add/remove .bypassing CSS class for visual effect
  // 4. Re-enable scroll-snap, call callback
}
```

The bypass is triggered by `wheel` and `touchend` events on ranks 3 and 7 when in default mode.

### Section Visibility (Intersection Observer)

An `IntersectionObserver` watches all sections at a `threshold: 0.5` (50% visible). When a section enters view:
1. `STATE.currentSection` updates
2. Side nav dots update (`.active` class)
3. Header scroll state updates
4. Entrance animations trigger (GSAP)

---

## 6. Collections & Product Data

### COLLECTIONS Array

Defined in `js/main.js`. Each collection object:

```javascript
{
  id:          'first-move',     // kebab-case, used in data attributes
  name:        'First Move',     // display name
  description: '...',            // marketing copy
  badge:       'Available Now',  // chip label ('Available Now' | 'Coming Soon')
  thumbnail:   'images/products/pieces_Stoic.P.FFFFFF.jpg',
  lines: [
    {
      id:          'stoic',      // kebab-case
      name:        'Stoic',      // display name
      description: '...',
      thumbnail:   'images/products/pieces_Stoic.P.FFFFFF.jpg',
      pieces:      ['P','B','N','R','Q','K'],  // available pieces
      colorways:   ['FFFFFF','F0D9B5','B58863','D4AF37','FBD9E1']  // hex IDs
    }
  ]
}
```

### COLORWAYS Array

```javascript
var COLORWAYS = [
  { id: 'FFFFFF', name: 'White',   hex: '#FFFFFF', textColor: '#1C1410' },
  { id: 'F0D9B5', name: 'Ivory',   hex: '#F0D9B5', textColor: '#1C1410' },
  { id: 'B58863', name: 'Caramel', hex: '#B58863', textColor: '#F0D9B5' },
  { id: 'D4AF37', name: 'Gold',    hex: '#D4AF37', textColor: '#1C1410' },
  { id: 'FBD9E1', name: 'Blush',   hex: '#FBD9E1', textColor: '#1C1410' }
];
```

### Piece Pricing

```javascript
var PIECE_PRICES = {
  P: 65,   // Pawn
  B: 89,   // Bishop
  N: 110,  // Knight
  R: 130,  // Rook
  Q: 175,  // Queen
  K: 220   // King
};
```

---

## 7. Product Image Convention

All product images follow this exact naming pattern:

```
images/products/pieces_[Line].[Piece].[ColorHex].jpg
```

### Line Prefix Map (Case-Sensitive)

| Line ID  | File Prefix |
|---------|-------------|
| `stoic` | `Stoic`     |
| `grain` | `Grain`     |
| `ti`    | `TI`        |
| `pasture`| `Pasture`  |

### Piece Codes

| Code | Piece  |
|------|--------|
| `P`  | Pawn   |
| `B`  | Bishop |
| `N`  | Knight |
| `R`  | Rook   |
| `Q`  | Queen  |
| `K`  | King   |

### Color Hex IDs

Use the hex code without the `#` symbol:

| Colorway | File Hex |
|----------|----------|
| White    | `FFFFFF`  |
| Ivory    | `F0D9B5`  |
| Caramel  | `B58863`  |
| Gold     | `D4AF37`  |
| Blush    | `FBD9E1`  |

### Example Paths

```
images/products/pieces_Stoic.P.FFFFFF.jpg    → Stoic line, Pawn, White
images/products/pieces_TI.Q.D4AF37.jpg       → TI line, Queen, Gold
images/products/pieces_Pasture.K.B58863.jpg  → Pasture line, King, Caramel
```

Images that don't exist are silently hidden (`onerror="this.style.display='none'"`). The `placeholder-product.svg` serves as a fallback in some contexts.

---

## 8. Adding New Collections & Lines

### Step 1 — Add to COLLECTIONS array (js/main.js)

```javascript
{
  id:          'queens-gambit',
  name:        "Queen's Gambit",
  description: 'Strategic sacrifice. Bold moves for bolder minds.',
  badge:       'Available Now',
  thumbnail:   'images/products/pieces_[YourLine].P.FFFFFF.jpg',
  lines: [
    {
      id:          'your-line-id',
      name:        'Your Line Name',
      description: 'Line description.',
      thumbnail:   'images/products/pieces_YourLine.P.FFFFFF.jpg',
      pieces:      ['P','B','N','R','Q','K'],
      colorways:   ['FFFFFF','F0D9B5','B58863']
    }
  ]
}
```

### Step 2 — Add to LINE_IMAGE_PREFIX map (js/main.js)

```javascript
var LINE_IMAGE_PREFIX = {
  stoic:        'Stoic',
  grain:        'Grain',
  ti:           'TI',
  pasture:      'Pasture',
  'your-line-id': 'YourLine'   // ← add entry
};
```

### Step 3 — Add product images

Place all images in `website/images/products/` following the naming convention:

```
pieces_YourLine.P.FFFFFF.jpg
pieces_YourLine.P.F0D9B5.jpg
pieces_YourLine.B.FFFFFF.jpg
... etc.
```

### Step 4 — Add new colorways (optional)

To add a new colorway, append to the `COLORWAYS` array in `js/main.js`:

```javascript
{ id: 'RRGGBB', name: 'ColorName', hex: '#RRGGBB', textColor: '#1C1410' }
```

Then add the hex ID to each line's `colorways` array.

---

## 9. Design System

### Color Palette

| Variable         | Value      | Use                           |
|-----------------|------------|-------------------------------|
| `--sq-light`    | `#F0D9B5`  | Light chess squares, backgrounds |
| `--sq-dark`     | `#1C1410`  | Dark chess squares, text      |
| `--sq-dark-warm`| `#2C1E14`  | Hover states for dark squares |
| `--gold`        | `#C9A84C`  | Accent — interactive elements |
| `--gold-light`  | `#E8C97A`  | Accent hover states           |

### Typography

| Variable          | Font                        | Use            |
|------------------|-----------------------------|----------------|
| `--font-display` | Bebas Neue → Arial Black    | "7TH RANK", large headlines |
| `--font-heading` | Playfair Display → Georgia  | Section titles |
| `--font-body`    | Inter → Helvetica Neue      | Body copy, UI  |

Fonts are loaded from Google Fonts CDN with `display=swap`.

### Logo Rendering

The SVG logo (`images/logo.svg`) uses `fill="black"` on all paths. The CSS applies different treatments contextually:

```css
/* Header (dark background) → convert black to white */
.header-logo img { filter: brightness(0) invert(1); }

/* Rank 1 logo square (light ivory background) → show natural black */
.sq-light .sq-logo-img { filter: none; }
```

### Breakpoints

```css
@media (max-width: 768px)  { /* Mobile */ }
@media (max-width: 1024px) { /* Tablet */ }
```

---

## 10. SEO Architecture

The `index.html` `<head>` includes a full SEO suite:

### Structured Data (JSON-LD)

Three schemas are embedded:

1. **ClothingStore** — brand entity, catalog structure, social profiles
2. **WebSite** — SearchAction for site search (future)
3. **FAQPage** — 4 Q&As optimized for AI/LLM search indexing (ChatGPT, Perplexity, Gemini)

### Meta Tags

- **Primary SEO:** title, description, keywords, robots, canonical
- **AI Semantic:** category, subject, classification, topic, summary, abstract
- **Open Graph:** og:type, og:image (1200×630), og:locale
- **Twitter Card:** summary_large_image

### OG Image

The file `images/og-image.jpg` is referenced but **not yet created**.

**Requirements:**
- Dimensions: 1200 × 630px
- Content: Brand aesthetic with logo + "One Square From Promotion"
- Format: JPEG, optimized (< 200KB target)
- Place at: `website/images/og-image.jpg`

---

## 11. Animations

### GSAP (CDN)

GSAP 3.12.5 and ScrollTrigger are loaded from cdnjs:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
```

GSAP is used for:
- Staggered entrance animations (letters in Rank 1, pieces in Rank 2)
- Rank 3 collection cards stagger
- Logo reveal

### Pawn Advance Animation

When the user navigates from the landing (via Queen or King click) to Rank 3, a pawn piece animates across the screen:

- **Trigger:** `triggerPawnAdvance()` called on entering Rank 3
- **Element:** `#pawn-advance` (`.pawn-advance-anim` overlay div)
- **Keyframes:** `@keyframes pawnAdvance` in CSS — pawn slides in from bottom, holds, exits

```javascript
function triggerPawnAdvance() {
  if (!pawnAdvance) return;
  pawnAdvance.classList.add('active');
  setTimeout(function () {
    pawnAdvance.classList.remove('active');
  }, 1800);
}
```

### Bypass Flash Animation

The `.bypassing` CSS class is toggled on middle ranks (4–6) during the scroll bypass:

```css
.rank.bypassing {
  opacity: 0.4;
  transform: scaleY(0.97);
  transition: opacity 100ms, transform 100ms;
}
```

---

## 12. Cart & Checkout

### Cart Item Structure

```javascript
{
  id:         'stoic-P-FFFFFF-M',     // unique: line-piece-color-size
  collection: 'First Move',
  line:       'Stoic',
  lineId:     'stoic',
  piece:      'P',                    // piece code
  pieceName:  'Pawn',
  colorway:   { id: 'FFFFFF', name: 'White', hex: '#FFFFFF', textColor: '#1C1410' },
  size:       'M',
  price:      65,                     // dollars
  imagePath:  'images/products/pieces_Stoic.P.FFFFFF.jpg',
  qty:        1
}
```

### Cart Functions

| Function                  | Description                                    |
|--------------------------|------------------------------------------------|
| `handleAddToCart()`      | Validates selection, adds to STATE.cart, updates UI |
| `updateCartUI()`         | Re-renders cart drawer, updates count badge    |
| `removeFromCart(itemId)` | Removes by ID from STATE.cart, updates UI      |
| `handleCheckout()`       | Transitions to rank-7 checkout mode            |

### Checkout Flow (Current)

The checkout UI is currently a **static HTML form** (no payment processor connected). Integrating a real payment system requires one of:

1. **Stripe.js** — Replace `#stripe-card-element` placeholder with real Stripe Elements
2. **Shopify** — Full Storefront API integration (see Section 13)
3. **Square / PayPal** — Alternative processors

---

## 13. Shopify Integration (Next Step)

The site is built for Shopify integration. The current product data in `COLLECTIONS` and the checkout form are stubs intended to be replaced with live Shopify data.

### Recommended Approach: Shopify Storefront API

**Step 1 — Create Shopify store** at `7thrank.myshopify.com`

**Step 2 — Install Storefront API credentials**
- Generate a Storefront API access token (read-only, public)
- Add to `js/main.js` as a constant:

```javascript
var SHOPIFY_DOMAIN = '7thrank.myshopify.com';
var SHOPIFY_TOKEN  = 'your_storefront_access_token';
var SHOPIFY_API    = 'https://' + SHOPIFY_DOMAIN + '/api/2024-01/graphql.json';
```

**Step 3 — Replace product data fetch**

Replace the static `COLLECTIONS` array with a GraphQL fetch:

```javascript
async function fetchCollections() {
  const query = `{
    collections(first: 10) {
      edges {
        node {
          id
          title
          products(first: 50) {
            edges {
              node {
                id
                title
                variants(first: 10) {
                  edges { node { id price { amount } selectedOptions { name value } } }
                }
              }
            }
          }
        }
      }
    }
  }`;
  const res = await fetch(SHOPIFY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
    },
    body: JSON.stringify({ query })
  });
  return res.json();
}
```

**Step 4 — Replace checkout with Shopify Buy Button or Checkout URL**

```javascript
async function createShopifyCheckout(cartItems) {
  // Create checkout with Storefront API
  // Redirect to Shopify checkout URL
}
```

### Alternative: Shopify Buy Button SDK

Simpler but less control. Embeds a Shopify-hosted cart. Replace the payment section of Rank 7 with the Buy Button SDK mount point.

---

## 14. Contact Form Integration

The contact form in Rank 7 currently only does client-side validation. To enable real email delivery:

### Option A — Formspree (Simplest)

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Remove the JS `preventDefault()` on the form and let Formspree handle submission and redirect.

### Option B — EmailJS (No backend, AJAX)

```javascript
emailjs.send('service_id', 'template_id', {
  name:    formData.get('name'),
  email:   formData.get('email'),
  subject: formData.get('subject'),
  message: formData.get('message')
});
```

Add the EmailJS SDK CDN link in `index.html`.

### Option C — Netlify Forms (If deploying to Netlify)

Add `netlify` attribute to the form element — Netlify auto-detects on deploy:

```html
<form id="contact-form" netlify netlify-honeypot="bot-field">
  <input type="hidden" name="bot-field">
  <!-- existing fields -->
</form>
```

---

## 15. Deployment

### Static Hosting Options

The site is a static SPA — any static host works.

| Host          | Setup                                   | Best For             |
|--------------|----------------------------------------|----------------------|
| **Vercel**   | Connect GitHub repo, auto-deploy         | Simplest, free tier  |
| **Netlify**  | Connect GitHub, forms built-in           | Free forms + CDN     |
| **Cloudflare Pages** | Connect GitHub, global CDN edge | Performance          |
| **AWS S3 + CloudFront** | Manual, most control          | Scale & custom config|

### Vercel Deployment (Recommended)

1. Push to GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import `7th-rank-website`
3. Set **Root Directory** to `website/`
4. Framework Preset: **Other** (static site)
5. Deploy — Vercel auto-assigns a `.vercel.app` domain

### Custom Domain

Set `www.7thrank.com` as the custom domain in your hosting provider's dashboard. Update:
- `index.html`: All `https://www.7thrank.com` references are already set
- SSL is auto-provisioned by all recommended hosts

### Environment Variables (For Shopify Integration)

When integrating Shopify or EmailJS, store tokens as environment variables on your hosting platform, not in the codebase:

```
SHOPIFY_STOREFRONT_TOKEN=...
EMAILJS_SERVICE_ID=...
```

---

## 16. GitHub Workflow

### Repository Structure

```
repo root = 7th-rank-website/ (the entire project folder)
deployable site = website/ subdirectory
```

### Branch Strategy

```
main        → production (auto-deploys to live site)
develop     → integration branch (test before releasing)
feature/*   → feature branches (PR into develop)
hotfix/*    → urgent fixes (PR directly into main)
```

### GitHub Actions

See `.github/workflows/deploy.yml` for the automated pipeline.

The workflow:
1. Triggers on push to `main`
2. Validates HTML (`html-validate`)
3. Lints CSS (`stylelint`)
4. Deploys `website/` to Vercel (or your chosen host)

### Commit Message Convention

```
feat:    New feature (new collection, new rank behavior)
fix:     Bug fix (scroll issue, styling correction)
style:   CSS-only changes
content: Copy, image, or product data changes
seo:     SEO meta or schema updates
docs:    Documentation only
```

---

## 17. Known Constraints & Decisions

### Why Vanilla JS (no framework)?
The site's DOM is mostly static HTML rendered at build time. JS renders dynamic sections (ranks 4–6) but the output is small enough that React/Vue would add unnecessary overhead and complexity for this size project.

### Why inline CSS scroll-snap (not JS scroll library)?
CSS `scroll-snap-type: y mandatory` gives native browser performance for the rank-to-rank snap without a JS animation loop. GSAP handles entrance animations only, not the scrolling itself.

### Why `fill="black"` on the logo SVG?
The single black SVG is reused in two contexts with different CSS `filter` values:
- Header (dark background): `filter: brightness(0) invert(1)` → white
- Rank 1 square (light background): `filter: none` → natural black

This avoids maintaining two separate SVG files.

### Why `hidden` attribute for ranks 4–6 initially?
Ranks 4–6 use the HTML `hidden` attribute (not just CSS `display:none`) to signal to accessibility tools that these sections are not currently available. They become visible when the user enters shopping mode.

### Why no `scroll-snap-type` on mobile during bypass?
The bypass animation (`bypassMiddleRanks`) temporarily sets `board.style.scrollSnapType = 'none'` to allow programmatic scrolling through middle ranks. Snap is restored after the flash completes.

### Contact form grid — `grid-column: 5 / -1`
The `.rank-7-contact` grid has 5 columns (4 info squares + 1 form column). The form wrapper uses `grid-column: 5 / -1` (not `5 / 9`) because the grid only has 5 columns and `-1` always refers to the last grid line regardless of column count.

### TI line image prefix — uppercase `TI`
The image files for the TI garment line are named `pieces_TI.*` (all caps), not `pieces_Ti.*`. The `LINE_IMAGE_PREFIX` map enforces this: `{ ti: 'TI' }`.
