# Overall Design Strategy for 7th Rank Chess Apparel

## Overview

This document outlines the comprehensive design strategy for the 7th Rank chess apparel website, covering chess board web layout techniques, design inspiration, scroll-based navigation, brand interpretation, Figma asset integration, Shopify e-commerce integration, WordPress deployment, and animation strategies. The goal is to create a visually striking, technically sound, and commercially effective web experience that embodies the chess promotion metaphor.

---

## 1. Chess Board Web Design Techniques

### 1.1 CSS Grid Chess Board Layout

CSS Grid is the ideal technology for creating a chess board layout on the web. The 7th Rank website uses a unique interpretation: each **rank** (row) of the chess board becomes a full-width page section, and each **square** within that rank holds content.

#### Core Grid Structure

```css
/* Full chess board section - one rank */
.rank {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  min-height: 100vh;
  width: 100%;
}

/* Individual square within a rank */
.square {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}
```

#### Alternating Color Pattern

The chess board alternating pattern follows a mathematical rule: if `(row + column)` is even, the square is light; if odd, the square is dark.

```css
/* Light squares */
.rank:nth-child(odd) .square:nth-child(odd),
.rank:nth-child(even) .square:nth-child(even) {
  background-color: var(--color-light-square, #F5F0E1);
  color: var(--color-dark-text, #1a1a1a);
}

/* Dark squares */
.rank:nth-child(odd) .square:nth-child(even),
.rank:nth-child(even) .square:nth-child(odd) {
  background-color: var(--color-dark-square, #1a1a1a);
  color: var(--color-light-text, #F5F0E1);
}
```

#### Responsive Grid Adaptation

The 8-column grid must adapt to smaller screens:

```css
/* Desktop: Full 8-column chess board */
@media (min-width: 1024px) {
  .rank {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* Tablet: 4-column layout */
@media (min-width: 768px) and (max-width: 1023px) {
  .rank {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Mobile: 2-column layout */
@media (min-width: 480px) and (max-width: 767px) {
  .rank {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Small mobile: Single column */
@media (max-width: 479px) {
  .rank {
    grid-template-columns: 1fr;
  }
}
```

### 1.2 HTML Structure for Rank Sections

Each rank is a full-width section capable of holding diverse content types:

```html
<main class="chess-board">
  <!-- Rank 8 (top of board, first visible) -->
  <section class="rank rank-8" id="rank-8" data-rank="8">
    <div class="square" data-file="a">
      <!-- Text content, images, or media -->
    </div>
    <div class="square" data-file="b">
      <!-- Product card -->
    </div>
    <!-- ... squares c through h -->
  </section>

  <!-- Rank 7 (the brand's namesake rank) -->
  <section class="rank rank-7" id="rank-7" data-rank="7">
    <!-- Special styling for the 7th rank -->
    <div class="square featured">
      <!-- Hero content about promotion/transformation -->
    </div>
    <!-- ... -->
  </section>

  <!-- Ranks 6 through 1 -->
  <!-- ... -->
</main>
```

### 1.3 JavaScript Chess Board Generation

For dynamic board generation:

```javascript
function createChessBoard() {
  const board = document.querySelector('.chess-board');
  
  for (let rank = 8; rank >= 1; rank--) {
    const rankSection = document.createElement('section');
    rankSection.className = `rank rank-${rank}`;
    rankSection.id = `rank-${rank}`;
    rankSection.dataset.rank = rank;
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    files.forEach((file, index) => {
      const square = document.createElement('div');
      square.className = 'square';
      square.dataset.file = file;
      
      // Determine light/dark based on rank + file index
      const isLight = (rank + index) % 2 === 0;
      square.classList.add(isLight ? 'light' : 'dark');
      
      rankSection.appendChild(square);
    });
    
    board.appendChild(rankSection);
  }
}
```

### 1.4 Content Within Squares

Each square can hold different content types:
- **Text blocks**: Headlines, descriptions, brand messaging
- **Product cards**: Image, name, price, CTA button
- **Media**: Background images, video loops, animated elements
- **Interactive elements**: Hover effects, click-to-expand details
- **Empty/decorative**: Some squares can be purely visual (chess piece silhouettes, patterns)

---

## 2. Chess-Themed Design Inspiration

### 2.1 Color Palette

The color palette draws from chess board aesthetics combined with luxury streetwear sensibilities:

#### Primary Colors
| Color | Hex | Usage |
|---|---|---|
| Pure Black | `#000000` | Dark squares, primary text, headers |
| Pure White | `#FFFFFF` | Light squares, reverse text |
| Warm Ivory | `#F5F0E1` | Softer light square alternative, backgrounds |
| Charcoal | `#2C2C2C` | Softer dark alternative, body text |

#### Accent Colors
| Color | Hex | Usage |
|---|---|---|
| Gold | `#D4AF37` | CTAs, highlights, promotion metaphor, premium elements |
| Deep Green | `#1B4332` | Classic chess board green, secondary accents |
| Forest Green | `#2D6A4F` | Lighter green variant for hover states |
| Crimson | `#8B0000` | Error states, sale badges, urgency |

#### CSS Custom Properties Implementation
```css
:root {
  /* Primary */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-ivory: #F5F0E1;
  --color-charcoal: #2C2C2C;
  
  /* Accent */
  --color-gold: #D4AF37;
  --color-deep-green: #1B4332;
  --color-forest-green: #2D6A4F;
  --color-crimson: #8B0000;
  
  /* Semantic */
  --color-light-square: var(--color-ivory);
  --color-dark-square: var(--color-charcoal);
  --color-cta-primary: var(--color-gold);
  --color-cta-hover: #B8962E;
  --color-text-on-dark: var(--color-ivory);
  --color-text-on-light: var(--color-charcoal);
}
```

### 2.2 Typography

Typography should evoke both chess sophistication and streetwear edge:

#### Font Stack Recommendations

**Headlines / Display**
- **Primary choice**: Bebas Neue or Oswald — bold, condensed, high-impact sans-serif that works for both chess rank numbers and streetwear headlines.
- **Alternative**: Montserrat Bold — geometric, modern, versatile.
- Use for: Section titles, rank numbers, hero text, CTAs.

**Body Text**
- **Primary choice**: Inter or DM Sans — clean, highly readable, modern sans-serif.
- **Alternative**: Source Sans Pro — professional, excellent readability.
- Use for: Product descriptions, blog content, navigation.

**Accent / Special**
- **Primary choice**: Playfair Display — elegant serif that adds chess sophistication.
- **Alternative**: Cormorant Garamond — refined, classical feel.
- Use for: Quotes, chess terminology, brand taglines, special callouts.

**Monospace (for chess notation)**
- **Choice**: JetBrains Mono or Fira Code — for displaying chess notation (e.g., 1.e4 e5 2.Nf3).
- Use for: Chess move references, technical details.

#### Typography Scale
```css
:root {
  --font-display: 'Bebas Neue', 'Oswald', sans-serif;
  --font-body: 'Inter', 'DM Sans', sans-serif;
  --font-accent: 'Playfair Display', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
  --text-7xl: 4.5rem;    /* 72px */
  --text-rank: 8rem;     /* 128px - for rank numbers */
}
```

### 2.3 Design Trends Alignment (2025-2026)

Based on current luxury streetwear design trends:

- **Next-gen futurism**: Incorporate subtle neon or holographic accents on the gold elements for a modern edge.
- **Minimalism as luxury**: Clean layouts with generous negative space communicate premium quality.
- **Bold high-contrast**: The chess board's inherent black/white contrast aligns perfectly with this trend.
- **Gender-neutral styling**: Design the website and product presentation to be inclusive and gender-neutral.
- **Oversized typography**: Large rank numbers and bold headlines create visual impact.
- **Custom illustrations**: Consider custom chess piece illustrations in a streetwear style.
- **Attention to detail**: Micro-interactions and subtle animations communicate quality and craftsmanship.

---

## 3. Scroll-Based Navigation Patterns

### 3.1 Full-Page Scroll-Snap

CSS scroll-snap provides native browser support for section-by-section navigation:

```css
/* Container */
.chess-board {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

/* Each rank snaps into view */
.rank {
  scroll-snap-align: start;
  min-height: 100vh;
}
```

#### Considerations
- `scroll-snap-type: y mandatory` forces snapping to the nearest section.
- `scroll-snap-type: y proximity` allows more natural scrolling with gentle snapping.
- For the 7th Rank site, `mandatory` creates a more deliberate, chess-move-like navigation feel.

### 3.2 GSAP ScrollTrigger Approach

GSAP ScrollTrigger provides more control over scroll-based animations and can replicate fullPage.js-style navigation:

```javascript
// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Pin each rank section and animate content
document.querySelectorAll('.rank').forEach((rank, index) => {
  // Pin the section
  ScrollTrigger.create({
    trigger: rank,
    start: 'top top',
    end: 'bottom top',
    pin: true,
    pinSpacing: true,
    snap: 1,
  });
  
  // Animate squares within the rank
  const squares = rank.querySelectorAll('.square');
  gsap.from(squares, {
    opacity: 0,
    y: 50,
    stagger: 0.1,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: rank,
      start: 'top 80%',
      end: 'top 20%',
      toggleActions: 'play none none reverse',
    }
  });
});
```

#### Full-Page Snapping with GSAP
GSAP can achieve smooth full-page snapping similar to fullPage.js:
- Supports mouse scroll, touch interactions, and keyboard navigation.
- Works smoothly across mobile and desktop platforms.
- Can be applied to specific sections rather than the entire page.
- Allows custom animations and transitions between sections.

**Source**: GSAP Community Forums discussion on smooth full-page snapping (May 2025) — https://gsap.com/community/forums/topic/44627-smooth-full-page-snapping-with-gsap-like-fullpagejs/

### 3.3 Intersection Observer Approach

The Intersection Observer API provides a lightweight alternative for triggering animations:

```javascript
// Create observer for rank sections
const rankObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const rank = entry.target;
      rank.classList.add('rank-visible');
      
      // Animate squares sequentially
      const squares = rank.querySelectorAll('.square');
      squares.forEach((square, index) => {
        setTimeout(() => {
          square.classList.add('square-visible');
        }, index * 100);
      });
      
      // Update rank indicator
      updateRankIndicator(rank.dataset.rank);
    }
  });
}, {
  threshold: 0.5,
  rootMargin: '0px'
});

// Observe all rank sections
document.querySelectorAll('.rank').forEach(rank => {
  rankObserver.observe(rank);
});
```

#### Benefits of Intersection Observer
- More efficient than manual scroll event tracking.
- Reduces unnecessary computational overhead.
- Supports responsive and performance-optimized web experiences.
- Native browser API — no external library required.
- Ideal for lazy loading images and triggering CSS animations.

**Source**: MDN Web Docs — https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

### 3.4 Recommended Hybrid Approach

For the 7th Rank website, a hybrid approach is recommended:

1. **CSS scroll-snap** for the base snapping behavior (native, performant).
2. **GSAP ScrollTrigger** for complex animations between ranks (fade, slide, scale effects).
3. **Intersection Observer** for lazy loading images and triggering simple CSS animations.

This layered approach ensures:
- Smooth navigation even if JavaScript fails (CSS scroll-snap as fallback).
- Rich animations for users with capable devices.
- Optimal performance through lazy loading.

---

## 4. 7th Rank Brand Interpretation

### 4.1 The Chess Metaphor

In chess, the **7th rank** is where a pawn is one square away from **promotion** — the moment a humble pawn can transform into the most powerful piece on the board (typically a queen). This is one of the most dramatic and strategically significant moments in chess.

#### Key Metaphorical Themes
- **Transformation**: The pawn's journey from the 2nd rank to the 8th rank represents personal growth and evolution.
- **Ambition**: Reaching the 7th rank requires navigating obstacles, making sacrifices, and strategic thinking.
- **Potential**: On the 7th rank, the pawn holds immense potential — it's one move away from becoming anything.
- **Perseverance**: The pawn is the most numerous but least powerful piece; its promotion is a story of perseverance.
- **The Underdog**: The pawn starts as the least valued piece but can become the most powerful — a perfect streetwear narrative.

#### Strategic Significance in Chess
- Rooks on the 7th rank put immense pressure on the opponent's position.
- A pawn on the 7th rank creates complex tactical opportunities and often decides the game.
- Blocking a pawn's advancement on the 7th rank is a critical defensive challenge.
- The most common promotion is to a queen, providing maximum strategic advantage.

**Sources**: Wikipedia, Chess.com, Chess Stack Exchange

### 4.2 Brand Narrative & Visual Hierarchy

The website should tell the story of the pawn's journey through its visual hierarchy:

#### Rank-by-Rank Narrative Structure

| Rank | Theme | Content Focus | Visual Treatment |
|---|---|---|---|
| **Rank 1 (Bottom)** | "The Opening" | Brand introduction, hero section | Bold, dramatic entrance |
| **Rank 2** | "First Move" | New arrivals, latest drops | Fresh, energetic |
| **Rank 3** | "Development" | Core collections | Structured, organized |
| **Rank 4** | "The Center" | Featured products, bestsellers | Prominent, commanding |
| **Rank 5** | "The Attack" | Limited editions, collaborations | Dynamic, urgent |
| **Rank 6** | "Advancing" | Brand story, community | Warm, personal |
| **Rank 7** | "One Square Away" | Premium/flagship products | Gold accents, elevated |
| **Rank 8 (Top)** | "Promotion" | CTA, newsletter, social links | Triumphant, celebratory |

#### Visual Hierarchy Principles
- **Rank 7 gets special treatment**: As the brand's namesake, this rank should have unique styling — gold accents, larger typography, premium product showcasing.
- **Progressive intensity**: Visual intensity and brand messaging should build as the user scrolls from Rank 1 to Rank 8.
- **The gold thread**: Gold accent color appears sparingly in early ranks and becomes more prominent approaching Rank 7-8, symbolizing the approaching promotion.

### 4.3 Brand Voice & Messaging

- **Tagline options**: "One Square From Promotion" / "Elevate Your Game" / "The Move Before the Crown"
- **Tone**: Confident, strategic, aspirational — like a chess player who sees the winning move.
- **Language**: Blend chess terminology with streetwear culture (e.g., "Drop" = new collection, "Opening" = brand introduction, "Endgame" = sale/clearance).

---

## 5. Figma Asset References

### 5.1 Client-Provided Figma Assets

The client has provided Figma assets across three categories:
- **Figma Make**: Brand identity and design system elements
- **Website Design**: Website layout and UI component designs
- **Clothing Designs**: Apparel product designs and mockups

### 5.2 Placeholder Asset Strategy

Until Figma exports are available, the website should use a structured placeholder system that allows easy swapping:

#### Directory Structure for Assets
```
website/images/
├── brand/
│   ├── logo.svg              # Brand logo (swap with Figma export)
│   ├── logo-white.svg        # White variant
│   ├── logo-dark.svg         # Dark variant
│   ├── favicon.ico           # Favicon
│   └── og-image.jpg          # Open Graph image (1200x630)
├── products/
│   ├── product-placeholder.webp  # Generic product placeholder
│   ├── hoodie-placeholder.webp   # Category-specific placeholders
│   ├── tee-placeholder.webp
│   └── accessory-placeholder.webp
├── lifestyle/
│   ├── hero-placeholder.webp     # Hero section background
│   ├── lifestyle-1.webp          # Lifestyle imagery
│   └── lifestyle-2.webp
├── chess/
│   ├── pawn.svg                  # Chess piece SVGs
│   ├── queen.svg
│   ├── king.svg
│   ├── rook.svg
│   ├── bishop.svg
│   └── knight.svg
└── patterns/
    ├── chess-board-pattern.svg   # Repeating chess board pattern
    └── chess-board-overlay.svg   # Semi-transparent overlay
```

#### Placeholder Implementation
```html
<!-- Product image with easy swap path -->
<img 
  src="images/products/product-placeholder.webp"
  alt="7th Rank King's Gambit Hoodie - Black"
  class="product-image"
  data-figma-asset="clothing-designs/kings-gambit-hoodie"
  width="600"
  height="800"
  loading="lazy"
>
```

#### Figma Export Workflow
Based on current best practices for Figma-to-HTML workflows:

1. **Export from Figma**: Use Figma's built-in export or plugins like:
   - **Export Design Plugin**: Quickly converts Figma projects to HTML/CSS.
   - **Anima Plugin**: Generates HTML/CSS code snippets from designs.
   - **TeleportHQ**: Exports components and design systems.
   - **Figma Export HTML/CSS + PUG/SASS Plugin**: Generates production-ready markup.
   - **Builder.io Visual Copilot**: AI-powered conversion from Figma to HTML.

2. **Asset export settings**:
   - SVG for logos, icons, and chess piece illustrations.
   - WebP at 2x resolution for product and lifestyle images.
   - PNG with transparency for overlays and decorative elements.

3. **Naming convention**: Match placeholder file names exactly so swapping requires only replacing files, not updating code.

**Sources**: Builder.io (https://www.builder.io/blog/convert-figma-to-html), Anima (https://www.animaapp.com/blog/design-to-code/how-to-export-figma-to-html/)

---

## 6. Shopify Integration Patterns

### 6.1 Shopify Buy Button Overview

Shopify Buy Button (also known as Shopify Lite integration) allows embedding product purchasing functionality into any custom HTML website without migrating to a full Shopify theme.

#### How It Works
1. Sign up for a Shopify account (Starter plan or higher).
2. Add the Buy Button sales channel in Shopify admin.
3. Select products to sell and customize the Buy Button appearance.
4. Generate an embed code (JavaScript snippet).
5. Paste the embed code into the custom HTML website.

The Buy Button renders a complete cart and checkout experience, including:
- Product display with images, title, price
- Variant selection (size, color)
- Add to Cart functionality
- Cart drawer/modal
- Secure Shopify-hosted checkout

#### Integration Code Example
```html
<!-- Shopify Buy Button embed -->
<div id="product-component-kings-gambit-hoodie"></div>
<script type="text/javascript">
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript();
    }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: '7th-rank.myshopify.com',
      storefrontAccessToken: 'your-storefront-access-token',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: 'PRODUCT_ID',
        node: document.getElementById('product-component-kings-gambit-hoodie'),
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
          product: {
            styles: {
              product: { '@media (min-width: 601px)': { 'max-width': '100%' } }
            },
            buttonDestination: 'cart',
            contents: { img: true, title: true, price: true },
            text: { button: 'Add to Cart' }
          },
          cart: {
            styles: { button: { 'background-color': '#D4AF37' } },
            text: { total: 'Subtotal', button: 'Checkout' },
            popup: false
          }
        }
      });
    });
  }
})();
</script>
```

### 6.2 Customization for 7th Rank

- **Button styling**: Override default Shopify Buy Button styles to match the 7th Rank gold/black color scheme.
- **Cart behavior**: Use a slide-out cart drawer that matches the chess board aesthetic.
- **Product display**: Customize the product component to show chess-themed product information.
- **Multiple products**: Each product square on the chess board can have its own Buy Button component.

### 6.3 Alternative: Shopify Storefront API

For more advanced integration, the Shopify Storefront API provides:
- Full control over product display and cart functionality.
- Custom checkout flows.
- GraphQL-based data fetching.
- Headless commerce architecture.

This is recommended if the Buy Button's customization options are too limiting for the chess board layout.

**Sources**: Shopify Help Center (https://help.shopify.com/en/manual/online-sales-channels/buy-button/add-embed-code), Shopify Community (https://community.shopify.com/c/hydrogen-headless-and-storefront/integrating-into-a-static-html-website/td-p/905085)

---

## 7. WordPress Deployment

### 7.1 Deployment Methods

There are several approaches to deploying a static HTML/CSS/JS site on WordPress:

#### Method 1: Simply Static Plugin (Recommended)
The **Simply Static** plugin (rated 4.5/5 with 192 reviews on WordPress.org) converts a WordPress site into static HTML, CSS, and JavaScript files.

**Benefits**:
- Instant page loading
- Enhanced security (no server-side processing)
- Reduced server costs
- Available on both WordPress.org and WordPress.com

**Workflow**:
1. Build the 7th Rank site as static HTML/CSS/JS.
2. Install WordPress and the Simply Static plugin.
3. Import the static files or recreate the structure in WordPress.
4. Use Simply Static to generate and serve static files.

**Source**: https://wordpress.org/plugins/simply-static/

#### Method 2: Custom WordPress Theme
Convert the static HTML/CSS/JS into a WordPress theme:

1. Create a theme directory in `wp-content/themes/7th-rank/`.
2. Split `index.html` into WordPress template parts:
   - `header.php` — site header and navigation
   - `footer.php` — site footer
   - `index.php` — main template
   - `page-home.php` — custom homepage template (chess board layout)
   - `page-collections.php` — collections page template
   - `page-about.php` — about page template
3. Enqueue CSS and JS files via `functions.php`.
4. Use WordPress's template hierarchy for page routing.

#### Method 3: Custom HTML Blocks in Page Builders
Use WordPress page builders (Elementor, Gutenberg) with custom HTML blocks:

1. Install WordPress with a minimal theme.
2. Use the Gutenberg block editor's "Custom HTML" block.
3. Paste the chess board HTML structure into custom HTML blocks.
4. Enqueue CSS and JS files via a child theme's `functions.php` or a plugin like "Insert Headers and Footers."

#### Method 4: Hybrid Approach
1. Use WordPress as the CMS for blog content (chess culture articles).
2. Serve the main landing page and product pages as static HTML.
3. Place static files in a folder alongside WordPress's `index.php`.
4. Use `.htaccess` or server configuration to route traffic appropriately.

### 7.2 Recommended Approach for 7th Rank

**Custom WordPress Theme** is the recommended approach because:
- Full control over the chess board layout and animations.
- WordPress CMS for blog content management (chess culture articles).
- Plugin ecosystem for SEO (Yoast/Rank Math), caching, and security.
- Easy content updates for non-technical team members.
- Shopify Buy Button can be embedded directly in theme templates.

**Source**: Simply Static (https://simplystatic.com/convert-wordpress-to-static/), InstaWP deployment guide (December 5, 2025)

---

## 8. Animation & Transition Strategy

### 8.1 CSS Transitions

CSS transitions handle simple state changes efficiently:

```css
/* Square hover effect */
.square {
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.square:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Rank section entrance */
.rank {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.rank.rank-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Square staggered entrance */
.square {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.square.square-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delay for each square */
.square:nth-child(1) { transition-delay: 0.0s; }
.square:nth-child(2) { transition-delay: 0.05s; }
.square:nth-child(3) { transition-delay: 0.1s; }
.square:nth-child(4) { transition-delay: 0.15s; }
.square:nth-child(5) { transition-delay: 0.2s; }
.square:nth-child(6) { transition-delay: 0.25s; }
.square:nth-child(7) { transition-delay: 0.3s; }
.square:nth-child(8) { transition-delay: 0.35s; }
```

### 8.2 GSAP Animations

GSAP provides more sophisticated animation capabilities:

#### Rank Entrance Animations
```javascript
// Fade + slide up for rank sections
gsap.from('.rank', {
  opacity: 0,
  y: 100,
  duration: 1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.rank',
    start: 'top 80%',
    toggleActions: 'play none none reverse'
  }
});
```

#### Square Stagger Animation
```javascript
// Staggered entrance for squares within a rank
document.querySelectorAll('.rank').forEach(rank => {
  const squares = rank.querySelectorAll('.square');
  
  gsap.from(squares, {
    opacity: 0,
    scale: 0.8,
    y: 30,
    stagger: {
      each: 0.08,
      from: 'start'  // or 'center', 'edges', 'random'
    },
    duration: 0.6,
    ease: 'back.out(1.7)',
    scrollTrigger: {
      trigger: rank,
      start: 'top 70%',
      toggleActions: 'play none none reverse'
    }
  });
});
```

#### Rank Transition Effects
```javascript
// Crossfade between ranks
function transitionToRank(currentRank, nextRank) {
  const tl = gsap.timeline();
  
  tl.to(currentRank, {
    opacity: 0,
    scale: 0.95,
    duration: 0.5,
    ease: 'power2.in'
  })
  .fromTo(nextRank, 
    { opacity: 0, scale: 1.05 },
    { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
    '-=0.2'  // Overlap for smooth transition
  );
  
  return tl;
}
```

#### Background Scaling with Pinned Sections
```javascript
// Background image scales in as section pins
gsap.to('.rank-7 .background-image', {
  scale: 1.2,
  ease: 'none',
  scrollTrigger: {
    trigger: '.rank-7',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    pin: true
  }
});
```

**Source**: GSAP ScrollTrigger documentation, Motion.page tutorial (https://motion.page/learn/create-awesome-scaling-effects-using-pinned-section-motion-page-gsap-scrolltrigger/)

### 8.3 Animation Types by Context

| Animation Type | CSS/JS | Use Case | Performance |
|---|---|---|---|
| **Fade in** | CSS transition | Square entrance, content reveal | Excellent |
| **Slide up** | CSS transition | Text blocks, product cards | Excellent |
| **Scale** | CSS transition | Hover effects, image zoom | Excellent |
| **Stagger** | GSAP | Sequential square reveals | Good |
| **Parallax** | GSAP ScrollTrigger | Background images, depth effect | Good |
| **Pin + scrub** | GSAP ScrollTrigger | Section pinning, progress-based animation | Good |
| **Morph/path** | GSAP MorphSVG | Chess piece transformations | Moderate |
| **3D rotate** | CSS transform | Card flip effects | Good |

### 8.4 Performance Guidelines

- **Prefer CSS transitions** for simple state changes (hover, visibility).
- **Use GSAP** only for complex, multi-step, or scroll-linked animations.
- **Animate only `transform` and `opacity`** — these properties are GPU-accelerated and don't trigger layout recalculation.
- **Use `will-change`** sparingly on elements that will be animated.
- **Reduce motion**: Respect `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- **Mobile optimization**: Simplify or disable complex animations on mobile devices to maintain performance.
- **Lazy animation loading**: Only initialize GSAP animations for sections that are near the viewport.

### 8.5 Specific Animation Sequences

#### Homepage Load Sequence
1. **0.0s**: Page loads, black screen
2. **0.3s**: 7th Rank logo fades in (center screen)
3. **0.8s**: Logo scales down and moves to header position
4. **1.0s**: Hero rank (Rank 1) fades in with chess board pattern
5. **1.2s**: Hero text slides up ("One Square From Promotion")
6. **1.5s**: CTA button fades in
7. **1.8s**: Scroll indicator appears (animated down arrow)

#### Rank Navigation Sequence
1. Current rank content fades out (0.3s)
2. Chess board pattern transition (0.2s)
3. New rank content fades in with staggered squares (0.5s)
4. Rank indicator updates (0.2s)

#### Product Card Hover Sequence
1. Card scales up slightly (1.02x)
2. Shadow deepens
3. Product image zooms slightly
4. "Quick View" overlay fades in
5. Price/CTA becomes more prominent

---

## 9. Technical Implementation Summary

### 9.1 Recommended Technology Stack

| Technology | Purpose | Justification |
|---|---|---|
| **HTML5 Semantic** | Structure | SEO, accessibility, AI search compatibility |
| **CSS Grid** | Chess board layout | Native 8-column grid support |
| **CSS Custom Properties** | Theming | Dynamic light/dark square colors |
| **CSS scroll-snap** | Base navigation | Native, performant snapping |
| **GSAP + ScrollTrigger** | Advanced animations | Industry standard, Awwwards-quality |
| **Intersection Observer** | Lazy loading, triggers | Native API, performant |
| **Shopify Buy Button** | E-commerce | Easy integration, secure checkout |
| **JSON-LD** | Structured data | SEO, AI search visibility |
| **WebP + fallbacks** | Images | Optimal compression with compatibility |

### 9.2 Browser Support Targets

- Chrome 90+ (CSS Grid, scroll-snap, Intersection Observer)
- Firefox 90+ (full support)
- Safari 15+ (scroll-snap support)
- Edge 90+ (Chromium-based, full support)
- Mobile Safari (iOS 15+)
- Chrome for Android (latest)

### 9.3 Performance Targets

- **Lighthouse score**: 90+ on all categories (Performance, Accessibility, Best Practices, SEO)
- **LCP**: Under 2.5 seconds
- **CLS**: Under 0.1
- **INP**: Under 200ms
- **TTFB**: Under 200ms
- **Total page weight**: Under 2MB (initial load)
- **JavaScript bundle**: Under 150KB (gzipped)

---

## Sources

- CSS Grid Chess Board Tutorial (dev.to): https://dev.to/hira_zaira/create-a-chessboard-using-css-grid-3iil
- CSS Grid Chess Board (Pete Houston): https://blog.petehouston.com/draw-chess-board-using-css-grid/
- GeeksforGeeks Chess Pattern CSS: https://www.geeksforgeeks.org/web-templates/how-to-create-chess-pattern-background-using-html-and-css/
- GSAP Community — Full-Page Snapping: https://gsap.com/community/forums/topic/44627-smooth-full-page-snapping-with-gsap-like-fullpagejs/
- GSAP ScrollTrigger Scaling Effects: https://motion.page/learn/create-awesome-scaling-effects-using-pinned-section-motion-page-gsap-scrolltrigger/
- MDN — Intersection Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- Shopify Buy Button Help: https://help.shopify.com/en/manual/online-sales-channels/buy-button/add-embed-code
- Shopify Community — Static HTML Integration: https://community.shopify.com/c/hydrogen-headless-and-storefront/integrating-into-a-static-html-website/td-p/905085
- Simply Static WordPress Plugin: https://wordpress.org/plugins/simply-static/
- Simply Static Conversion Guide: https://simplystatic.com/convert-wordpress-to-static/
- Builder.io — Figma to HTML: https://www.builder.io/blog/convert-figma-to-html
- Anima — Figma Export: https://www.animaapp.com/blog/design-to-code/how-to-export-figma-to-html/
- Cueball Creatives — Streetwear Design Trends 2026: https://www.cueballcreatives.com/blog/streetwear-design-trends-2026
- Chess.com — Pawn Promotion: https://www.chess.com/terms/pawn-promotion
- Wikipedia — Chess Promotion: https://en.wikipedia.org/wiki/Promotion_(chess)

---

*Document prepared for the 7th Rank Chess Apparel website project — Research Phase*
*Last updated: February 16, 2026*
