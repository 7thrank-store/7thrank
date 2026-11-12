/**
 * 7th Rank route table. One source of truth for URLs, prices and page tags.
 * Loaded in the browser (window.SEVENTH_RANK_ROUTES) and by scripts/build-routes.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SEVENTH_RANK_ROUTES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PRICES = { chessboards: 189, pieces: 99 };

  var SUBLINES = {
    chessboards: {
      name: 'Chessboards',
      garment: 'Turtleneck',
      material: 'Baby Alpaca',
      fabricNote: '100% Baby Alpaca. Made in Peru. 7th Rank logo and all pieces are embroidered.',
      care: [
        { icon: 'hand-wash', label: 'Hand wash cold' },
        { icon: 'dry-clean-p', label: 'Professional dry clean' },
        { icon: 'iron-low', label: 'Iron low' },
        { icon: 'no-bleach', label: 'Do not bleach' },
        { icon: 'dry-flat-shade', label: 'Dry flat' },
        { icon: 'no-tumble', label: 'Do not tumble dry' }
      ],
      items: {
        'weathered-walnut': { id: 'ww', image: 'chessboards/chessboards_ww.pawn.l/resource/ww.pawn.l_1.png', name: 'Weathered Walnut', caption: 'Reserved, aged, and contemplative. A thinker that stands the test of time.' },
        'ice-castle':       { id: 'ic', image: 'chessboards/chessboards_ic.pawn.l/resource/ic.pawn.l_1.png', name: 'Ice Castle',       caption: 'Piercing fluidity. Sharper than the eye perceives.' },
        'stone':            { id: 's',  image: 'chessboards/chessboards_s.pawn.l/resource/s.pawn.l_1.png', name: 'Stone',            caption: 'An impenetrable force and immovable object. Paradoxically mastered.' }
      }
    },
    pieces: {
      name: 'Pieces',
      garment: 'Crewneck',
      material: 'Tanguis Cotton',
      fabricNote: '100% Tanguis Cotton. Made in Peru. 7th Rank logo and all pieces are embroidered.',
      care: [
        { icon: 'machine-gentle', label: 'Machine wash gentle or delicate' },
        { icon: 'no-bleach', label: 'Do not bleach' },
        { icon: 'dry-flat', label: 'Dry flat' },
        { icon: 'tumble-low', label: 'Tumble dry low' },
        { icon: 'iron-medium', label: 'Iron medium' }
      ],
      items: {
        'stoic':    { id: 'stoic',   image: 'pieces/pieces_Stoic.P.FFFFFF/resource/0.png', name: 'Stoic',    caption: 'The truest one.' },
        'grain':    { id: 'grain',   image: 'pieces/pieces_Grain.P.FFFFFF/resource/0.png', name: 'Grain',    caption: 'Details between the lines.' },
        'thin-ice': { id: 'ti',      image: 'pieces/pieces_TI.P.FFFFFF/resource/0.png', name: 'Thin Ice', caption: 'Cool, calm, collected, whilst your opponent shivers.' },
        'pasture':  { id: 'pasture', image: 'pieces/pieces_Pasture.P.FFFFFF/resource/0.png', name: 'Pasture',  caption: 'Open space leads to clearer minds.' },
        'harmony':  { id: 'harmony', image: 'pieces/pieces_Harmony.P.F0D9B5/resource/0.png', name: 'Harmony',  caption: 'Ebb and flow; effortlessly natural.' }
      }
    }
  };

  var COLLECTION = 'first-move';
  var COLLECTION_NAME = 'First Move';
  var COLLECTION_TAGLINE = 'Limited and Exclusive. For those bold enough to make the First Move.';
  var COMING_SOON = ['Engine', 'Promotions', 'Najdorf'];
  var SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  var PIECE_NAMES = ['Pawn', 'Bishop', 'Knight', 'Rook', 'Queen', 'King'];
  var PLACEMENTS = { l: 'Left Chest', r: 'Right Chest', hl: 'Hip Left', hr: 'Hip Right', sl: 'Sleeve Left', sr: 'Sleeve Right' };
  var PIECE_SLUGS = { P: 'pawn', R: 'rook', N: 'knight', B: 'bishop', Q: 'queen', K: 'king' };
  var PLACEMENT_SLUGS = { l: 'left-chest', r: 'right-chest', hl: 'hip-left', hr: 'hip-right', sl: 'sleeve-left', sr: 'sleeve-right' };
  var THREAD_SLUGS = { FFFFFF: 'white', F0D9B5: 'ivory', B58863: 'caramel', D4AF37: 'gold', FBD9E1: 'blush' };

  function invert(map) {
    var out = {};
    Object.keys(map).forEach(function (k) { out[map[k]] = k; });
    return out;
  }
  var PIECE_BY_SLUG = invert(PIECE_SLUGS);
  var PLACEMENT_BY_SLUG = invert(PLACEMENT_SLUGS);
  var THREAD_BY_SLUG = invert(THREAD_SLUGS);

  var BASE = '/collections/' + COLLECTION + '/';

  function itemPath(subline, id) {
    var items = SUBLINES[subline].items;
    var slug = Object.keys(items).filter(function (s) { return items[s].id === id; })[0];
    return slug ? BASE + subline + '/' + slug + '/' : BASE + subline + '/';
  }

  /** Reads a pathname and query string. Returns null for an unknown path. */
  function parse(pathname, search) {
    var parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    var params = {};
    (search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    if (parts.length === 0) return { page: 'landing' };
    if (parts.length === 1 && parts[0] === 'contact') return { page: 'contact' };
    if (parts.length === 1 && (parts[0] === 'privacy' || parts[0] === 'terms')) return { page: parts[0] };
    if (parts[0] !== 'collections') return null;
    if (parts.length === 1) return { page: 'collections' };
    if (parts[1] !== COLLECTION) return null;
    if (parts.length === 2) return { page: 'collection' };
    var sub = SUBLINES[parts[2]];
    if (!sub) return null;
    if (parts.length === 3) return { page: 'subline', subline: parts[2] };
    var item = sub.items[parts[3]];
    if (!item || parts.length > 4) return null;
    return {
      page: 'item',
      subline: parts[2],
      itemId: item.id,
      piece: PIECE_BY_SLUG[params.piece] || null,
      placement: PLACEMENT_BY_SLUG[params.placement] || null,
      thread: THREAD_BY_SLUG[params.thread] || null
    };
  }

  /** Builds a garment URL. Default selections stay out of the query string. */
  function garmentPath(subline, id, opts) {
    var q = [];
    if (opts.piece && opts.piece !== 'P') q.push('piece=' + PIECE_SLUGS[opts.piece]);
    if (opts.placement && opts.placement !== 'l') q.push('placement=' + PLACEMENT_SLUGS[opts.placement]);
    if (opts.thread && opts.thread !== opts.defaultThread) q.push('thread=' + THREAD_SLUGS[opts.thread]);
    return itemPath(subline, id) + (q.length ? '?' + q.join('&') : '');
  }

  /** Every page that gets its own URL, with its title and description. */
  function pages() {
    var list = [
      { path: '/', page: 'landing', priority: '1.0',
        title: 'Premium Chess Apparel & Merchandise | 7th Rank',
        description: 'Premium chess apparel for those who move with intention. Baby Alpaca turtlenecks at $' + PRICES.chessboards + ' and Tanguis cotton crewnecks at $' + PRICES.pieces + ', embroidered with chess pieces. Ships worldwide.' },
      { path: '/collections/', page: 'collections', priority: '0.9',
        title: 'Chess Apparel Collections | 7th Rank',
        description: 'Explore 7th Rank collections, starting with First Move: refined chess turtlenecks and crewnecks with embroidered pieces.' },
      { path: BASE, page: 'collection', priority: '0.9',
        title: 'First Move Collection | 7th Rank',
        description: 'Limited and exclusive. First Move is our debut collection of Chessboards turtlenecks and Pieces crewnecks.' },
      { path: '/contact/', page: 'contact', priority: '0.5',
        title: 'Contact | 7th Rank',
        description: 'Questions about an order or a piece? Reach the 7th Rank team.' },
      { path: '/privacy/', page: 'privacy', priority: '0.2',
        title: 'Privacy Policy | 7th Rank',
        description: 'How 7th Rank collects and uses your information.' },
      { path: '/terms/', page: 'terms', priority: '0.2',
        title: 'Terms of Service | 7th Rank',
        description: 'The terms for using 7th-rank.com and buying from 7th Rank.' }
    ];
    Object.keys(SUBLINES).forEach(function (key) {
      var sub = SUBLINES[key];
      var price = PRICES[key];
      list.push({
        path: BASE + key + '/', page: 'subline', subline: key, priority: '0.8',
        title: sub.name + ' ' + sub.garment + 's | 7th Rank',
        description: 'The ' + sub.name + ' line from First Move: ' + sub.garment.toLowerCase() + 's with embroidered chess pieces, $' + price + '.'
      });
      Object.keys(sub.items).forEach(function (slug) {
        var item = sub.items[slug];
        list.push({
          path: BASE + key + '/' + slug + '/', page: 'item', subline: key, slug: slug, priority: '0.8',
          title: item.name + ' ' + sub.name + ' ' + sub.garment + ' | 7th Rank',
          description: item.caption + ' The ' + item.name + ' ' + sub.garment.toLowerCase() + ' with embroidered chess pieces, $' + price + '.',
          product: { name: item.name + ' ' + sub.name + ' ' + sub.garment, description: item.caption, price: price, image: item.image }
        });
      });
    });
    return list;
  }

  return {
    PRICES: PRICES,
    SUBLINES: SUBLINES,
    COLLECTION: COLLECTION,
    COLLECTION_NAME: COLLECTION_NAME,
    COLLECTION_TAGLINE: COLLECTION_TAGLINE,
    COMING_SOON: COMING_SOON,
    SIZES: SIZES,
    PIECE_NAMES: PIECE_NAMES,
    PLACEMENTS: PLACEMENTS,
    BASE: BASE,
    PIECE_SLUGS: PIECE_SLUGS,
    parse: parse,
    garmentPath: garmentPath,
    itemPath: itemPath,
    pages: pages
  };
});
