#!/usr/bin/env node
/**
 * Generates one real HTML page per site URL so direct links work on GitHub Pages
 * and each URL has its own title, description, and canonical tag. Also writes
 * sitemap.xml. Runs in the deploy workflow; run it locally before testing deep links.
 *
 *   node scripts/build-routes.js
 *
 * The generated folders are gitignored. website/index.html stays the only source.
 */
const fs = require('fs');
const path = require('path');
const routes = require('../website/js/routes.js');

const SITE = 'https://www.7th-rank.com';
const ROOT = path.join(__dirname, '..', 'website');
const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function esc(text) {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replaceOnce(html, pattern, value, label) {
  if (!pattern.test(html)) throw new Error('Template is missing ' + label);
  return html.replace(pattern, () => value);
}

function renderPage(page) {
  let html = template;
  const url = SITE + page.path;
  const title = esc(page.title);
  const description = esc(page.description);
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title');
  html = replaceOnce(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'og:title');
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'og:description');
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  html = replaceOnce(html, /<h1 class="sr-only">[^<]*<\/h1>/, `<h1 class="sr-only">${title}</h1>`, 'h1');
  if (page.product) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: page.product.name,
      description: page.product.description,
      brand: { '@type': 'Brand', name: '7th Rank' },
      url,
      image: SITE + '/images/products/first_move/' + page.product.image,
      offers: {
        '@type': 'Offer',
        price: page.product.price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreOrder',
        url
      }
    };
    html = html.replace('</head>', () => `  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
  }
  return html;
}

const pages = routes.pages();
pages.filter(p => p.path !== '/').forEach(page => {
  const dir = path.join(ROOT, ...page.path.split('/').filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderPage(page));
});

const urls = pages.map(p => `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n');
fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

process.stdout.write(`Generated ${pages.length - 1} route pages and sitemap.xml (${pages.length} URLs).\n`);
