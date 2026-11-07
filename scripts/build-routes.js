#!/usr/bin/env node
/**
 * Writes the site's pages from website/js/routes.js:
 *   - one HTML page per URL, with its own tags, schema and readable content
 *   - the same content and schema inside website/index.html (between its markers)
 *   - sitemap.xml and llms.txt
 * Runs in the deploy workflow; run it locally before testing deep links.
 *
 *   node scripts/build-routes.js
 *
 * Generated folders are gitignored. Running it again gives the same result.
 * With BUILD_VERSION set (the deploy does this), CSS and JS links get ?v=<version>
 * so returning visitors can't pair a new page with an old cached script.
 */
const fs = require('fs');
const path = require('path');
const routes = require('../website/js/routes.js');

const SITE = 'https://www.7th-rank.com';
const ROOT = path.join(__dirname, '..', 'website');
const IMAGE_BASE = '/images/products/first_move/';
const AVAILABILITY = 'Our first drop is coming soon. Join the list for early access.';
const VERSION = (process.env.BUILD_VERSION || '').slice(0, 12);

const template = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pages = routes.pages();
const pageAt = p => pages.find(page => page.path === p);

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replaceOnce(html, pattern, value, label) {
  if (!pattern.test(html)) throw new Error('Template is missing ' + label);
  return html.replace(pattern, () => value);
}

function stamp(html) {
  if (!VERSION) return html;
  return html.replace(/((?:href|src)="\/(?:css|js)\/[\w.-]+\.(?:css|js))(")/g, `$1?v=${VERSION}$2`);
}

function link(p, text) {
  return `<a href="${p}">${esc(text)}</a>`;
}

/* ── Where each page sits ── */
function trail(page) {
  const crumbs = [{ name: 'Home', path: '/' }];
  if (page.path === '/') return crumbs;
  if (page.path.startsWith('/collections/')) crumbs.push({ name: 'Collections', path: '/collections/' });
  if (page.path.startsWith(routes.BASE)) crumbs.push({ name: routes.COLLECTION_NAME, path: routes.BASE });
  if (page.subline) {
    const sub = routes.SUBLINES[page.subline];
    crumbs.push({ name: sub.name, path: routes.BASE + page.subline + '/' });
    if (page.slug) crumbs.push({ name: sub.items[page.slug].name, path: page.path });
  }
  if (crumbs[crumbs.length - 1].path !== page.path) crumbs.push({ name: page.title.split(' | ')[0], path: page.path });
  return crumbs;
}

function itemsOf(key) {
  const sub = routes.SUBLINES[key];
  return Object.keys(sub.items).map(slug => ({
    slug, item: sub.items[slug], path: routes.BASE + key + '/' + slug + '/',
    fullName: `${sub.items[slug].name} ${sub.name} ${sub.garment}`
  }));
}

/* ── Readable content ── */
function lineSummary(key) {
  const sub = routes.SUBLINES[key];
  return `${sub.garment}s in ${sub.fabricNote.split('.')[0]}, $${routes.PRICES[key]} USD. Each is embroidered with a chess piece of your choice: ${routes.PIECE_NAMES.join(', ')}.`;
}

function linkList(entries) {
  return `<ul>${entries.map(e => `<li>${link(e.path, e.name)}${e.note ? ' — ' + esc(e.note) : ''}</li>`).join('')}</ul>`;
}

function linesList() {
  return linkList(Object.keys(routes.SUBLINES).map(key => ({
    path: routes.BASE + key + '/',
    name: `${routes.SUBLINES[key].name} ${routes.SUBLINES[key].garment}s`,
    note: lineSummary(key)
  })));
}

function legalContent(id) {
  const match = template.match(new RegExp(`id="${id}-overlay"[\\s\\S]*?<div class="legal-content">([\\s\\S]*?)</div>`));
  if (!match) throw new Error('Template is missing the ' + id + ' text');
  return match[1].replace(/ id="[^"]*"/g, '').trim();
}

function bodyFor(page) {
  switch (page.page) {
    case 'landing':
      return `<h2>7th Rank: premium chess apparel</h2>
      <p>7th Rank creates premium chess apparel that celebrates the game's strategy and culture, one piece at a time. We ship worldwide.</p>
      <h3>${esc(routes.COLLECTION_NAME)}, our debut collection</h3>
      <p>${esc(routes.COLLECTION_TAGLINE)}</p>
      ${linesList()}
      <p>${link('/collections/', 'All collections')} · ${link('/contact/', 'Contact')}</p>`;
    case 'collections':
      return `<h2>Collections</h2>
      <p>${esc(page.description)}</p>
      <ul><li>${link(routes.BASE, routes.COLLECTION_NAME)} — ${esc(routes.COLLECTION_TAGLINE)}</li>
      ${routes.COMING_SOON.map(name => `<li>${esc(name)} — Coming soon</li>`).join('')}</ul>`;
    case 'collection':
      return `<h2>${esc(routes.COLLECTION_NAME)} Collection</h2>
      <p>${esc(routes.COLLECTION_TAGLINE)} ${esc(routes.COLLECTION_NAME)} is the debut collection from 7th Rank.</p>
      ${linesList()}
      <p>${esc(AVAILABILITY)}</p>`;
    case 'subline': {
      const sub = routes.SUBLINES[page.subline];
      return `<h2>${esc(sub.name)} ${esc(sub.garment)}s</h2>
      <p>${esc(lineSummary(page.subline))}</p>
      <h3>Colorways</h3>
      ${linkList(itemsOf(page.subline).map(e => ({ path: e.path, name: e.fullName, note: e.item.caption })))}
      <p>${esc(AVAILABILITY)}</p>`;
    }
    case 'item': {
      const key = page.subline;
      const sub = routes.SUBLINES[key];
      const item = sub.items[page.slug];
      const others = itemsOf(key).filter(e => e.slug !== page.slug);
      const row = (term, value) => `<dt>${esc(term)}</dt><dd>${esc(value)}</dd>`;
      return `<h2>${esc(page.product.name)}</h2>
      <img src="${IMAGE_BASE + item.image}" alt="${esc(page.product.name)}" width="600" loading="lazy">
      <p>${esc(item.caption)}</p>
      <dl>
        ${row('Price', '$' + routes.PRICES[key] + ' USD')}
        ${row('Material and craft', sub.fabricNote)}
        ${row('Embroidered piece', routes.PIECE_NAMES.join(', '))}
        ${key === 'chessboards' ? row('Placement', Object.values(routes.PLACEMENTS).join(', ')) : ''}
        ${row('Sizes', routes.SIZES.join(', '))}
        ${row('Care', sub.care.map(c => c.label).join('; '))}
        ${row('Availability', AVAILABILITY)}
      </dl>
      <h3>Also in ${esc(sub.name)}</h3>
      ${linkList(others.map(e => ({ path: e.path, name: e.fullName, note: e.item.caption })))}`;
    }
    case 'contact':
      return `<h2>Contact 7th Rank</h2>
      <p>${esc(page.description)} Email <a href="mailto:7thrankhelp@gmail.com">7thrankhelp@gmail.com</a>, or find us on <a href="https://www.instagram.com/7th.rank">Instagram</a> and <a href="https://www.tiktok.com/@7th.rank">TikTok</a> at @7th.rank.</p>`;
    case 'privacy':
    case 'terms':
      return legalContent(page.page);
    default:
      throw new Error('No content for page type ' + page.page);
  }
}

function detailsFor(page) {
  const crumbs = trail(page);
  const nav = crumbs.length > 1
    ? `<nav aria-label="Breadcrumb">${crumbs.slice(0, -1).map(c => link(c.path, c.name)).join(' / ')}</nav>\n      `
    : '';
  return `<div class="page-details">\n      ${nav}${bodyFor(page)}\n    </div>`;
}

/* ── Structured data ── */
function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`;
}

function itemList(name, entries) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.name, url: SITE + e.path }))
  };
}

function allProducts() {
  return Object.keys(routes.SUBLINES).flatMap(key => itemsOf(key).map(e => ({ name: e.fullName, path: e.path })));
}

function schemaFor(page) {
  const blocks = [];
  const crumbs = trail(page);
  if (crumbs.length > 1) {
    blocks.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE + c.path }))
    });
  }
  if (page.page === 'landing') blocks.push(itemList('First Move Collection', allProducts()));
  if (page.page === 'collections') blocks.push(itemList('7th Rank Collections', [{ name: routes.COLLECTION_NAME, path: routes.BASE }]));
  if (page.page === 'collection') {
    blocks.push(itemList('First Move Collection', Object.keys(routes.SUBLINES).map(key => ({
      name: `${routes.SUBLINES[key].name} ${routes.SUBLINES[key].garment}s`, path: routes.BASE + key + '/'
    }))));
  }
  if (page.page === 'subline') {
    const sub = routes.SUBLINES[page.subline];
    blocks.push(itemList(`${sub.name} ${sub.garment}s`, itemsOf(page.subline).map(e => ({ name: e.fullName, path: e.path }))));
  }
  if (page.product) {
    const url = SITE + page.path;
    const sub = routes.SUBLINES[page.subline];
    blocks.push({
      '@type': 'Product',
      name: page.product.name,
      description: page.product.description,
      brand: { '@type': 'Brand', name: '7th Rank' },
      url,
      image: SITE + IMAGE_BASE + page.product.image,
      material: sub.material,
      countryOfOrigin: { '@type': 'Country', name: 'Peru' },
      color: sub.items[page.slug].name,
      size: routes.SIZES.join(', '),
      offers: {
        '@type': 'Offer',
        price: page.product.price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreOrder',
        url
      }
    });
  }
  return blocks.map(jsonLd).join('\n  ');
}

/* ── Pages ── */
function renderPage(page) {
  let html = template;
  const url = SITE + page.path;
  const title = esc(page.title);
  const description = esc(page.description);
  const prices = Object.values(routes.PRICES);
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title');
  html = replaceOnce(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'og:title');
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'og:description');
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  html = replaceOnce(html, /<h1 class="sr-only">[^<]*<\/h1>/, `<h1 class="sr-only">${title}</h1>`, 'h1');
  html = replaceOnce(html, /"priceRange": "[^"]*"/, `"priceRange": "$${Math.min(...prices)}-$${Math.max(...prices)}"`, 'priceRange');
  html = replaceOnce(html, /<!-- PAGE_SCHEMA_START -->[\s\S]*?<!-- PAGE_SCHEMA_END -->/, `<!-- PAGE_SCHEMA_START -->${schemaFor(page)}<!-- PAGE_SCHEMA_END -->`, 'schema markers');
  html = replaceOnce(html, /<!-- PAGE_DETAILS_START -->[\s\S]*?<!-- PAGE_DETAILS_END -->/, `<!-- PAGE_DETAILS_START -->${detailsFor(page)}<!-- PAGE_DETAILS_END -->`, 'details markers');
  return stamp(html);
}

pages.forEach(page => {
  const dir = path.join(ROOT, ...page.path.split('/').filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderPage(page));
});

if (VERSION) {
  const notFound = path.join(ROOT, '404.html');
  fs.writeFileSync(notFound, stamp(fs.readFileSync(notFound, 'utf8')));
}

/* ── Sitemap ── */
const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(p => `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n');
fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

/* ── llms.txt: a plain summary of the site ── */
const llmsLines = Object.keys(routes.SUBLINES).flatMap(key => {
  const sub = routes.SUBLINES[key];
  return [
    `## ${sub.name} ${sub.garment}s`,
    '',
    lineSummary(key),
    '',
    `- [${sub.name} line](${SITE}${routes.BASE}${key}/)`,
    ...itemsOf(key).map(e => `- [${e.fullName}](${SITE}${e.path}): ${e.item.caption}`),
    ''
  ];
});
fs.writeFileSync(path.join(ROOT, 'llms.txt'), [
  '# 7th Rank',
  '',
  '> 7th Rank is a premium chess apparel brand, founded in 2026. It ships worldwide.',
  '',
  `${routes.COLLECTION_NAME} is the debut collection. ${routes.COMING_SOON.join(', ')} are coming soon. ${AVAILABILITY}`,
  '',
  ...llmsLines,
  '## Contact',
  '',
  `- [Contact page](${SITE}/contact/)`,
  '- [Instagram](https://www.instagram.com/7th.rank)',
  '- [TikTok](https://www.tiktok.com/@7th.rank)',
  ''
].join('\n'));

process.stdout.write(`Generated ${pages.length} pages, sitemap.xml and llms.txt${VERSION ? ` (version ${VERSION})` : ''}.\n`);
