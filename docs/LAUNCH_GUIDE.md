# 7th Rank — Launch & Operations Guide

> **Maintained by:** Ethan Nouhan & DeAngelo Descorbeth, Founders
> **Last updated:** March 2026
> **Status:** Pre-launch

---

## Table of Contents

1. [Pre-Launch Checklist](#1-pre-launch-checklist)
2. [Full Site Test Plan](#2-full-site-test-plan)
3. [Hosting & Deployment](#3-hosting--deployment)
4. [Shopify Integration](#4-shopify-integration)
5. [GitHub Best Practices](#5-github-best-practices)
6. [Automated Workflows](#6-automated-workflows)
7. [Post-Launch Monitoring](#7-post-launch-monitoring)
8. [Inputs Needed From You](#8-inputs-needed-from-you)

---

## 1. Pre-Launch Checklist

### Domain & DNS
- [ ] Purchase `7thrank.com` (if not already owned) — recommended registrars: Cloudflare, Namecheap
- [ ] Set up DNS: A record → host IP, CNAME `www` → root
- [ ] Enable HTTPS/SSL (free via Cloudflare or Let's Encrypt)
- [x] Set up `7thranksupport@gmail.com` as a forwarding alias if using a custom domain email

### Assets
- [ ] Create `/images/og-image.jpg` (1200×630px) — used for social share previews (OG/Twitter card)
- [ ] Add `/favicon.ico` + `/images/favicon-32x32.png` + `/images/apple-touch-icon.png` (180×180px)
- [ ] Confirm all product images are present and correctly named per the schema:
  - Chessboards: `chessboards_[variant].[piece].[location]_[1-4].jpg`
  - Pieces: `pieces_[Line].[Piece].[ColorHex].jpg`
- [x] Compress all images — `scripts/compress-images.js` (sharp/mozjpeg q82) reduced 108 files, saving 9.6 MB; all images now under 131KB. Re-run after adding new product images.

### Code & Configuration
- [ ] Update `canonical` URL in `index.html` line 13 from `https://www.7thrank.com/` to your actual domain
- [ ] Update all `og:url` and social meta URLs in `index.html` to match live domain
- [ ] Replace placeholder `https://www.7thrank.com/images/og-image.jpg` with actual hosted image URL
- [ ] Add `<meta name="theme-color" content="#1A3049">` to `<head>` (mobile browser chrome color)
- [ ] Add `<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">` to `<head>`
- [ ] Verify Google Apps Script email sender is authorized and sending correctly
- [ ] Test wishlist email delivery end-to-end

### Analytics & SEO
- [ ] Create [Google Search Console](https://search.google.com/search-console) account, verify domain
- [ ] Create [Google Analytics 4](https://analytics.google.com/) property, add tracking snippet to `index.html`
- [ ] Submit `sitemap.xml` — create a minimal one (single-page site)
- [ ] Verify JSON-LD structured data at [schema.org validator](https://validator.schema.org/)

### Legal
- [x] Add Privacy Policy page or modal — 9-section modal in `index.html`, opened via footer link or inline `data-open="privacy"` links
- [x] Add Terms of Service — 10-section modal in `index.html`, opened via footer link
- [x] Add cookie consent banner (GDPR) — `#cookie-banner` shown on first visit; preference stored in `localStorage('7r_cookie_consent')`
- [x] Wishlist email signup has explicit opt-in language (CAN-SPAM) — fine-print updated with consent statement + Privacy Policy link
- [x] Email template CAN-SPAM compliance — unsubscribe link (`doGet` handler in `Code.gs`), physical address placeholder in footer; `Unsubscribed` column added to sheet
- [ ] **ACTION REQUIRED**: Replace `[MAILING ADDRESS PLACEHOLDER]` in `email_template.html` with your actual registered mailing address before sending any emails

---

## 2. Full Site Test Plan

### 2A. Desktop Browser Matrix

Test on the following browser/OS combinations:

| Browser | Version | OS |
|---------|---------|-----|
| Chrome | Latest | Windows 11 |
| Chrome | Latest | macOS |
| Firefox | Latest | Windows 11 |
| Safari | Latest | macOS |
| Edge | Latest | Windows 11 |

**Free testing tools:** [BrowserStack](https://www.browserstack.com/) (free tier), [LambdaTest](https://www.lambdatest.com/)

---

### 2B. Mobile Device Matrix

| Device | OS | Browser |
|--------|-----|---------|
| iPhone 15 | iOS 17 | Safari |
| iPhone SE (small screen) | iOS 16 | Safari |
| Samsung Galaxy S24 | Android 14 | Chrome |
| iPad Pro 12.9" | iPadOS 17 | Safari |
| Pixel 7 | Android 13 | Chrome |

---

### 2C. Test Cases by Feature

#### Landing Page (Ranks 1–2)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| L1 | Load page fresh | Back row of pieces visible at top, "7TH RANK" at bottom | |
| L2 | Wait 6 seconds | Decorative squares (Rook, Knight, Bishop) cycle through faded product images | |
| L3 | Corner label check | Top-left shows "8", increments down to "1" at bottom | |
| L4 | Logo click (desktop header) | Returns to landing / scrolls to rank-1 | |
| L5 | COLLECTIONS nav link | Smooth scroll to rank-3 Collections | |
| L6 | CONTACT nav link | Smooth scroll to rank-7 Contact | |
| L7 | Cart icon | Opens cart drawer | |
| L8 | Keyboard: Tab through pieces | Queen and King focusable with visible focus ring | |
| L9 | Keyboard: Enter on Queen | Triggers Collections scroll | |
| L10 | Mobile: swipe down | Bypasses ranks 4-6, lands on rank-3 | |

#### Collections (Rank 3)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| C1 | Collections rank renders | "First Move" card visible, thumbnail cycling | |
| C2 | Click "First Move" | Scrolls to rank-4 Sub-line selector | |
| C3 | "Coming Soon" cards | Non-interactive, greyed out | |
| C4 | Carousel arrows | Scroll cards left/right | |

#### Sub-line Selector (Rank 4)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| S1 | Rank 4 loads | "Chessboards" (dark sq) and "Pieces" (light sq) cards fill screen | |
| S2 | Image cycling | Both cards cycle product images every ~5s | |
| S3 | "Chessboards" label readable | White text on dark/image background — visible | |
| S4 | "Pieces" label readable | Dark text on light background — visible | |
| S5 | Click Chessboards | Scrolls to rank-5 with 4 variant cards | |
| S6 | Click Pieces | Scrolls to rank-5 with 5 line cards | |

#### Garment Lines (Rank 5 — Chessboards)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| G1 | 4 variant cards shown | Weathered Walnut, Ice Castle, Stone, Princess Pink | |
| G2 | Each card has palette swatches | Two color circles visible below card image | |
| G3 | Hover on card (desktop) | Board bg updates to variant colors | |
| G4 | Click Weathered Walnut | Scroll to rank-6 chessboard customization | |
| G5 | Click Ice Castle | Rank-6 loads, boards visible in ice palette | |
| G6 | Click Stone | Rank-6 loads in gray palette | |
| G7 | Click Princess Pink | Rank-6 loads; button color follows palette (not blue) | |
| G8 | Card names alternate color | Odd cards = dark navy text, even cards = light blue text | |

#### Garment Lines (Rank 5 — Pieces)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| P1 | 5 line cards shown | Stoic, Grain, Thin Ice, Pasture, Harmony | |
| P2 | Cards alternate light/dark | Stoic=light, Grain=dark, TI=light, Pasture=dark, Harmony=light | |
| P3 | Card names alternate | Stoic=dark text, Grain=light, TI=dark, Pasture=dark(sq), Harmony=dark(sq on light) | |
| P4 | Click any line | Scroll to rank-6 pieces customization | |

#### Chessboard Customization (Rank 6 — Chessboards)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| CB1 | Preview image loads | Default: pawn, left chest, front shot | |
| CB2 | Select piece "Knight" + location "Sleeve Left" | Preview shows knight_l.sl_3.jpg (side view) | |
| CB3 | Select piece "Knight" + location "Sleeve Right" | Preview shows knight_r.sr_2.jpg | |
| CB4 | Piece buttons highlight selected | Active button has accent border | |
| CB5 | Location buttons highlight selected | Active button highlighted | |
| CB6 | Zoom in/out controls | Preview zooms correctly | |
| CB7 | Select size M | Size button highlights | |
| CB8 | Click "Add to Cart" without size | Alert "Please select a size" | |
| CB9 | Click "Add to Cart" without piece | Alert shown | |
| CB10 | Valid add to cart | Cart count increments, item visible in cart drawer | |
| CB11 | Add to Wishlist | Wishlist modal opens | |

#### Pieces Customization (Rank 6 — Pieces)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| PC1 | Preview image loads with default piece + colorway | Image visible | |
| PC2 | Switch piece | Preview updates | |
| PC3 | Switch colorway swatch | Preview updates | |
| PC4 | Grain line: no F0D9B5 swatch | Ivory/cream swatch absent from Grain | |
| PC5 | Harmony line: no FFFFFF swatch | White swatch absent from Harmony | |
| PC6 | Add to cart flow | Item added, price shows $69 | |
| PC7 | Add to wishlist | Modal opens, item saved | |

#### Contact (Rank 7)
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| CT1 | Info panel renders | Tagline, email link, social cards visible | |
| CT2 | Knight watermark visible | Animated SVG in top-right of panel, semi-transparent | |
| CT3 | Email link click | Opens mailto:7thranksupport@gmail.com | |
| CT4 | Instagram card click | Opens @7th.rank Instagram in new tab | |
| CT5 | TikTok card click | Opens @7th.rank TikTok in new tab | |
| CT6 | Contact form: empty submit | Validation prevents submission | |
| CT7 | Contact form: valid submission | Success state shown | |
| CT8 | Mobile layout | Grid collapses gracefully | |

#### Cart & Checkout
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| K1 | Cart drawer opens/closes | Smooth animation | |
| K2 | Remove item from cart | Item removed, count updates | |
| K3 | Cart shows correct price | $99 for chessboard, $69 for pieces | |
| K4 | Checkout button (post-Shopify) | Routes to Shopify checkout | |
| K5 | Empty cart state | "Your cart is empty" message | |

#### Wishlist & Email
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| W1 | Wishlist modal opens | Form with email input appears | |
| W2 | Submit with valid email | Confirmation shown, email triggers Google Apps Script | |
| W3 | Duplicate wishlist item | Not added twice | |
| W4 | Email received | Correct template with discount code and wishlist summary | |

#### Accessibility
| # | Test | Expected Result | Pass/Fail |
|---|------|----------------|-----------|
| A1 | Keyboard only navigation | Can reach all interactive elements via Tab | |
| A2 | Screen reader (VoiceOver/NVDA) | Ranks announced, pieces have aria-labels | |
| A3 | High contrast mode | Text remains readable | |
| A4 | Zoom to 200% | Layout doesn't break | |
| A5 | Reduced motion | No animations that cause discomfort | |

---

### 2D. Performance Targets

Run [PageSpeed Insights](https://pagespeed.web.dev/) and [WebPageTest](https://www.webpagetest.org/).

| Metric | Target | Notes |
|--------|--------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero image/text |
| FID / INP | < 100ms | Interaction responsiveness |
| CLS (Cumulative Layout Shift) | < 0.1 | No layout jumps |
| TTI (Time to Interactive) | < 3.5s | |
| PageSpeed Mobile | ≥ 80 | |
| PageSpeed Desktop | ≥ 90 | |

**Quick wins if scores are low:**
- Add `loading="lazy"` to all `<img>` tags in product JS renders (already on most)
- Serve images as WebP (use Cloudflare Image Resizing or [Squoosh](https://squoosh.app/))
- Add `rel="preconnect" href="https://fonts.googleapis.com"` before font import

---

## 3. Hosting & Deployment

### Recommended Stack: GitHub Pages → Cloudflare

```
GitHub repo (source of truth)
    ↓ push to main
GitHub Actions (auto-deploy)
    ↓
GitHub Pages (static hosting, free)
    ↓
Cloudflare (CDN, SSL, custom domain)
```

**Why this stack:**
- GitHub Pages: free, fast static hosting, integrates with GitHub Actions
- Cloudflare: free tier CDN, auto SSL, DDoS protection, image optimization
- Zero monthly cost for the static site itself

### Step-by-Step Setup

1. **GitHub Pages:**
   ```
   Repo Settings → Pages → Source: Deploy from branch → Branch: main → / (root)
   ```
   Your site will be live at `https://yourusername.github.io/7th-rank-website/`

2. **Custom Domain in GitHub Pages:**
   - In repo Settings → Pages → Custom domain: `www.7thrank.com`
   - This creates a `CNAME` file in your repo root

3. **Cloudflare DNS:**
   - Add site to Cloudflare
   - Set nameservers at your domain registrar to Cloudflare's
   - Create A record: `@` → GitHub Pages IP (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   - Create CNAME: `www` → `yourusername.github.io`
   - Enable "Proxied" (orange cloud) for CDN + SSL

4. **SSL:**
   - In Cloudflare: SSL/TLS → Full (strict)
   - GitHub will auto-issue certificate once domain is verified

### File Structure for Deployment

```
7th-rank-website/
├── website/           ← deploy this folder as the site root
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
├── docs/              ← internal documentation (not deployed)
├── google-apps-script/
└── .github/
    └── workflows/
        └── deploy.yml ← automated deploy workflow
```

> **Note:** Configure GitHub Pages to serve from `/website` subdirectory, or move website contents to repo root.

---

## 4. Shopify Integration

### Overview

The static 7th Rank site handles browsing, customization, and cart building. Shopify handles payment processing, order management, inventory, and fulfillment.

### Integration Architecture

```
User browses 7thrank.com (static site)
    ↓ clicks "Add to Cart" / "Checkout"
Shopify Storefront API or Buy Button
    ↓
Shopify checkout (hosted by Shopify)
    ↓
Order → fulfillment → shipping
```

### Integration Options (choose one)

#### Option A — Shopify Buy Button (Recommended for launch)
- Easiest integration, no Shopify coding required
- Shopify hosts the checkout and product catalog
- You embed a Buy Button JS snippet in your site
- **Cost:** Shopify Starter Plan ($5/mo) — includes Buy Button

**Steps:**
1. Create Shopify store at [shopify.com](https://shopify.com)
2. Add products matching your SKUs (see product schema below)
3. Install "Buy Button" sales channel in Shopify admin
4. Generate a Buy Button embed code for each product/variant
5. Replace the current "Add to Cart" handler in `main.js` with Shopify's `client.checkout.create()` call

#### Option B — Shopify Storefront API (More control)
- Programmatic cart creation and checkout redirect
- Requires a Shopify Storefront API access token
- Custom cart UI stays on your site; checkout redirects to Shopify
- **Cost:** Any Shopify plan

**Steps:**
1. Create Shopify store
2. Enable Storefront API: Admin → Apps → Develop apps → Create app → configure Storefront API scopes
3. Replace the `STATE.cart` logic with API calls:

```javascript
// Example: Create cart and redirect to Shopify checkout
async function checkoutWithShopify(cartItems) {
  const response = await fetch('https://YOUR-STORE.myshopify.com/api/2024-01/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': 'YOUR_TOKEN'
    },
    body: JSON.stringify({
      query: `mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { checkoutUrl }
        }
      }`,
      variables: { input: { lines: cartItems } }
    })
  });
  const data = await response.json();
  window.location.href = data.data.cartCreate.cart.checkoutUrl;
}
```

### Shopify Product Schema

Create these products in your Shopify admin:

**Chessboards (Turtlenecks) — $99**
- Product title: `[Variant] Chessboard Turtleneck` (e.g., "Ice Castle Chessboard Turtleneck")
- Variants: `[Piece] + [Location] + [Size]`
  - Pieces: Pawn, Bishop, Knight, Rook, Queen, King
  - Locations: Left Chest, Right Chest, Hip Left, Hip Right, Sleeve Left, Sleeve Right
  - Sizes: XS, S, M, L, XL, XXL
- 4 products total (one per variant: Weathered Walnut, Ice Castle, Stone, Princess Pink)
- Inventory: Set to unlimited until physical inventory is confirmed

**Pieces (Crewnecks) — $69**
- Product title: `[Line] Piece Crewneck` (e.g., "Stoic Piece Crewneck")
- Variants: `[Piece] + [Colorway] + [Size]`
- 5 products total (one per line: Stoic, Grain, Thin Ice, Pasture, Harmony)

**Discount Codes:**
- Create a discount code in Shopify: Admin → Discounts
- Link to the First Mover codes from your Google Apps Script emails

### Required Inputs for Shopify Integration

See [Section 8](#8-inputs-needed-from-you) for the full list.

---

## 5. GitHub Best Practices

### Repository Setup

```bash
# Initialize (if not already done)
git init
git remote add origin https://github.com/YOUR_USERNAME/7th-rank-website.git

# First push
git add .
git commit -m "feat: initial site launch"
git push -u origin main
```

### Branch Strategy

```
main          ← production (live site)
develop       ← integration branch (tested, not yet live)
feature/*     ← individual features
hotfix/*      ← emergency fixes to production
```

**Workflow:**
```bash
# New feature
git checkout -b feature/contact-form-update develop
# ... make changes ...
git commit -m "feat: update contact form CTA copy"
git push origin feature/contact-form-update
# Open Pull Request: feature/* → develop
# Review, merge to develop
# When ready: merge develop → main (triggers auto-deploy)
```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     new feature
fix:      bug fix
style:    CSS/visual changes (no logic changes)
content:  copy/text changes
perf:     performance improvement
chore:    maintenance, dependency updates
docs:     documentation only
```

**Examples:**
```
feat: add Stone variant to chessboard customization
fix: correct nth-child alternation for Harmony card text
style: increase cycling image opacity on landing page
content: update founders bio in contact page
```

### .gitignore

Create a `.gitignore` at the repo root:

```gitignore
# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/settings.json
*.swp

# Sensitive files — NEVER commit these
.env
*.env.local
google-apps-script/credentials.json
shopify-token.txt

# Build artifacts
node_modules/
dist/
.cache/
```

### Protecting main Branch

In GitHub: Settings → Branches → Add rule for `main`:
- ✅ Require pull request reviews before merging (minimum 1)
- ✅ Require status checks to pass before merging
- ✅ Restrict who can push to matching branches

### Releases & Tags

When publishing a significant update:

```bash
git tag -a v1.0.0 -m "Launch release — First Move collection"
git push origin v1.0.0
```

Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- `1.0.0` → initial launch
- `1.1.0` → new collection added
- `1.0.1` → bug fix

---

## 6. Automated Workflows

### Workflow 1 — Auto Deploy to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy website folder to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website
          publish_branch: gh-pages
```

**What this does:** Every push to `main` automatically deploys the `website/` folder to GitHub Pages. No manual upload needed.

---

### Workflow 2 — Pull Request Quality Check

Create `.github/workflows/pr-check.yml`:

```yaml
name: PR Quality Check

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for large files
        run: |
          find website/images -name "*.jpg" -size +500k -exec echo "WARNING: Large image: {}" \;
          find website/images -name "*.png" -size +500k -exec echo "WARNING: Large image: {}" \;

      - name: Validate HTML
        uses: Cyb3r-Jak3/html5validator-action@v7.2.0
        with:
          target: website/index.html

      - name: Check for console.log in JS
        run: |
          if grep -r "console\.log" website/js/; then
            echo "ERROR: console.log found in production JS"
            exit 1
          fi
```

**What this does:** On every Pull Request, automatically checks for oversized images, validates HTML, and ensures no debug `console.log` statements are in production code.

---

### Workflow 3 — Scheduled Lighthouse Audit

Create `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse Performance Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  workflow_dispatch:      # Also allows manual trigger

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            https://www.7thrank.com
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**What this does:** Runs a Lighthouse performance audit every Monday morning and stores results. You'll see a link in the GitHub Actions log to your score.

---

### Workflow 4 — Image Optimization Check

Create `.github/workflows/image-check.yml`:

```yaml
name: Image Size Check

on:
  push:
    paths:
      - 'website/images/**'

jobs:
  check-images:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check image file sizes
        run: |
          LARGE_FILES=$(find website/images -name "*.jpg" -o -name "*.png" -o -name "*.webp" | xargs du -k | awk '$1 > 400 {print $2 " (" $1 "KB)"}')
          if [ -n "$LARGE_FILES" ]; then
            echo "The following images exceed 400KB — consider optimizing:"
            echo "$LARGE_FILES"
          else
            echo "All images are within size limits."
          fi
```

**What this does:** Any time you push new images, this workflow warns you about files over 400KB.

---

### GitHub Secrets Required

For automated workflows involving Shopify or Analytics, you'll need to add GitHub Secrets:

Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value | Used By |
|-------------|-------|---------|
| `SHOPIFY_STOREFRONT_TOKEN` | Your Shopify API token | Checkout integration |
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Analytics |
| `GOOGLE_APPS_SCRIPT_URL` | Your deployed script URL | Email automation |

---

## 7. Post-Launch Monitoring

### Week 1 Checklist
- [ ] Monitor Google Search Console for crawl errors
- [ ] Check Google Analytics for real user data (bounce rate, device breakdown)
- [ ] Watch for JavaScript errors via browser DevTools or [Sentry](https://sentry.io/) (free tier)
- [ ] Test purchase flow with a real transaction
- [ ] Monitor email deliverability (check spam folder on first sends)

### Ongoing Monthly Tasks
- [ ] Run Lighthouse audit
- [ ] Check for broken image links (product images 404)
- [ ] Review and respond to contact form submissions
- [ ] Update product availability in Shopify as inventory changes
- [ ] Review discount code usage and refresh if needed

### Key Metrics to Track
| Metric | Tool | Goal |
|--------|------|------|
| Site traffic | Google Analytics | Growth month-over-month |
| Email signups | Google Apps Script logs | Track First Mover list growth |
| Cart abandonment | Shopify Analytics | < 70% |
| Conversion rate | Shopify Analytics | ≥ 2% |
| Page load speed | PageSpeed Insights | ≥ 85 mobile |
| Discount code redemptions | Shopify Discounts | Track ROI |

### Error Monitoring (Optional but Recommended)

Add [Sentry](https://sentry.io/) for automatic JS error reporting:

```html
<!-- Add to index.html <head> -->
<script
  src="https://browser.sentry-cdn.com/latest/bundle.min.js"
  crossorigin="anonymous"
></script>
<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production"
  });
</script>
```

---

## 8. Inputs Needed From You

The following information is required before automated workflows and Shopify integration can be completed. Provide these when ready:

### GitHub Setup
- [ ] **GitHub username** — needed to configure repo URL and GitHub Pages domain
- [ ] **Repository name** — `7th-rank-website` or your preferred name
- [ ] **Preferred deploy branch** — `main` (recommended)

### Domain & Hosting
- [ ] **Domain registrar** — where is `7thrank.com` registered? (Namecheap, GoDaddy, etc.)
- [ ] **Domain already purchased?** — Y/N. If not, purchase before configuring DNS.
- [ ] **Cloudflare account** — create one at cloudflare.com before DNS config

### Shopify
- [ ] **Shopify store URL** — `your-store.myshopify.com`
- [ ] **Shopify Storefront API access token** — generated from Shopify admin
- [ ] **Product variant IDs** — needed to map cart items to Shopify checkout line items
- [ ] **Chosen integration method** — Buy Button (simpler) or Storefront API (more control)?
- [ ] **Discount code format** — what format are First Mover codes? (e.g., `FM-XXXX-XXXX`)

### Email / Google Apps Script
- [ ] **Deployed Google Apps Script URL** — the `exec` URL for the wishlist submission handler
- [ ] **Confirmed test send** — has a test email been sent and received successfully?

### Analytics
- [ ] **Google Analytics 4 Measurement ID** — `G-XXXXXXXXXX`
- [ ] **Google Search Console verified** — Y/N

### Assets
- [ ] **OG image created** — `/images/og-image.jpg` at 1200×630px
- [ ] **Favicon set** — `/favicon.ico`, `/images/favicon-32x32.png`
- [ ] **Apple touch icon** — `/images/apple-touch-icon.png` at 180×180px

---

## Appendix A — File Reference

| File | Purpose |
|------|---------|
| `website/index.html` | Main site (all 8 ranks) |
| `website/css/style.css` | All styles (~2,900 lines) |
| `website/js/main.js` | State machine, navigation, cart, rendering |
| `website/images/logo.svg` | Animated knight SVG |
| `website/images/products/first_move/chessboards/` | Chessboard garment images |
| `website/images/products/first_move/pieces/` | Pieces garment images |
| `google-apps-script/Code.gs` | Email automation backend |
| `google-apps-script/email_template.html` | Branded email template |
| `.github/workflows/deploy.yml` | Auto-deploy to GitHub Pages |
| `docs/LAUNCH_GUIDE.md` | This document |

---

## Appendix B — Code Optimizations Applied (March 2026)

The following improvements were made during pre-launch code sweep:

**JavaScript:**
- Removed dead old-flow functions: `selectLine`, `renderPieces`, `selectPiece`, `renderColorways`, `handleAddToCart`, `handleAddToWishlist` (~170 lines removed)
- Removed empty `triggerPawnAdvance()` function and all call sites
- Removed unused `pawnAdvance` DOM reference
- Fixed potential infinite recursion in image cycler `onerror` handler (added retry limit of 4)
- Cached `querySelectorAll` results in click event handlers — eliminates repeated DOM queries on every button press in `renderChessboardCustomization` and `renderPiecesCustomization`

**CSS:**
- Removed dead `@keyframes pawnAdvance` animation and supporting classes (~26 lines removed)
- Removed unused `.collection-card-coming-soon::before` no-op rule
- Removed unused `.stripe-element-placeholder` and `.stripe-placeholder-ui` rules (leftover from unimplemented Stripe integration)
- Fixed rank-5 garment title color consistency: added `.rank-5 .product-card.sq-light/sq-dark` overrides to beat conflicting nth-child patterns — Harmony (5th item) now correctly shows dark text on its light square
- Strengthened sub-line card label visibility: taller gradient overlay (30% → 55%), stronger text-shadow, explicit `#FFFFFF` color for dark-square "Chessboards" label

---

*Document maintained in `docs/LAUNCH_GUIDE.md`*
