/**
 * 7th Rank Chess Apparel — Core Application
 *
 * Architecture: State machine driving a chess board UX
 * Key features:
 *  - Chess board navigation (ranks 1–8)
 *  - Default mode: 1→2→3→[flash 4-6]→7, back: 7→[flash 6-5-4]→3
 *  - Shopping mode: full 3→4→5→6→7(checkout)→8(confirm) flow
 *  - Queen/King → Pawn advance animation on entering Rank 3
 *  - Collections carousel for 8+ lines
 *  - Colorway selection, size selection, cart management
 *  - Dynamic Rank 7 (Contact vs Checkout)
 *  - Dynamic Rank 8 (Contact confirm vs Order confirm)
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     APP STATE
  ══════════════════════════════════════════════════ */
  var STATE = {
    mode:                'default',  // 'default' | 'shopping'
    currentSection:      'landing',  // section ID currently in view
    selectedCollection:  null,
    selectedLine:        null,
    selectedPiece:       null,
    selectedColorway:    null,
    selectedSize:        null,
    cart:                [],
    wishlist:            [],
    navigatingFrom:      null,       // 'queen' | 'king' (for pawn animation)
    carouselOffset:      0,
    isScrolling:         false,
    isBypassing:         false,
    isAnimating:         false,  // true during any programmatic smoothScrollTo
    selectedSubLine:     null,  // 'chessboards' | 'pieces'
    selectedCBVariant:   null,  // 'ww' | 'ic' | 's' | 'pp'
    selectedCBPiece:     null,  // 'pawn' | 'rook' | etc.
    selectedCBLocation:  null,  // 'l' | 'r' | 'hl' | 'hr' | 'sl' | 'sr'
    appliedPromo:        null   // { code, discountPct } or null
  };

  /* ══════════════════════════════════════════════════
     COLLECTIONS DATA
     product images: images/products/pieces_[Line].[Piece].[Color].jpg
  ══════════════════════════════════════════════════ */
  var PIECE_NAMES = {
    P: 'Pawn',
    B: 'Bishop',
    N: 'Knight',
    R: 'Rook',
    Q: 'Queen',
    K: 'King'
  };

  // \uFE0E = variation selector-15 (text presentation) — prevents iOS from
  // rendering chess glyphs as coloured emoji; forces consistent text rendering.
  var PIECE_ICONS = {
    P: '♟\uFE0E', B: '♝\uFE0E', N: '♞\uFE0E', R: '♜\uFE0E', Q: '♛\uFE0E', K: '♚\uFE0E'
  };

  var PIECE_PRICES = {
    P: 65, B: 89, N: 110, R: 130, Q: 175, K: 220
  };

  var COLORWAYS = [
    { id: 'FFFFFF', name: 'White',     hex: '#FFFFFF', textColor: '#1C1410' },
    { id: 'F0D9B5', name: 'Ivory',     hex: '#F0D9B5', textColor: '#1C1410' },
    { id: 'B58863', name: 'Caramel',   hex: '#B58863', textColor: '#F0D9B5' },
    { id: 'D4AF37', name: 'Gold',      hex: '#D4AF37', textColor: '#1C1410' },
    { id: 'FBD9E1', name: 'Blush',     hex: '#FBD9E1', textColor: '#1C1410' }
  ];

  /* ══════════════════════════════════════════════════
     CHESSBOARD LINE DATA
  ══════════════════════════════════════════════════ */
  var CHESSBOARD_VARIANTS = {
    ww: { id: 'ww', name: 'Weathered Walnut', lightColor: '#F0D9B5', darkColor: '#B58863' },
    ic: { id: 'ic', name: 'Ice Castle',       lightColor: '#BFEFFF', darkColor: '#FFFEEF' },
    s:  { id: 's',  name: 'Stone',            lightColor: '#FFFFFF', darkColor: '#535353' },
    pp: { id: 'pp', name: 'Princess Pink',    lightColor: '#FBD9E1', darkColor: '#FFFFFF' }
  };

  var CHESSBOARD_VARIANTS_LIST = ['ww', 'ic', 's', 'pp'];

  var CHESSBOARD_PIECES_CB = ['pawn','rook','knight','bishop','queen','king'];
  var CHESSBOARD_PIECE_ICONS_CB = {
    pawn: '♟\uFE0E', rook: '♜\uFE0E', knight: '♞\uFE0E', bishop: '♝\uFE0E', queen: '♛\uFE0E', king: '♚\uFE0E'
  };
  var CHESSBOARD_PIECE_NAMES_CB = {
    pawn: 'Pawn', rook: 'Rook', knight: 'Knight', bishop: 'Bishop', queen: 'Queen', king: 'King'
  };

  var CHESSBOARD_LOCATIONS = {
    l:  'Left Chest',
    r:  'Right Chest',
    hl: 'Hip Left',
    hr: 'Hip Right',
    sl: 'Sleeve Left',
    sr: 'Sleeve Right'
  };
  var CHESSBOARD_LOCATION_KEYS = ['l','r','hl','hr','sl','sr'];

  var CHESSBOARD_PRICE = 99;
  var PIECES_PRICE     = 69;

  /* Rank-6 modification color schemes — per variant/line */
  var CB_MOD_COLORS = {
    ww: {
      selBg: '#F0D9B5', selText: null, selBorder: '#0D1B2A',
      hoverBg: 'rgba(240,217,181,0.22)',
      cartBg: '#F0D9B5', cartText: '#0D1B2A', cartBorder: '#0D1B2A',
      cartHoverBg: '#B58863', cartHoverText: '#F0D9B5',
      confirmBg: '#B58863', confirmText: '#F0D9B5',
      wishlistHoverBg: '#F0D9B5', wishlistHoverText: '#B58863', wishlistHoverBorder: '#B58863'
    },
    ic: { confirmBg: '#BFEFFF', confirmText: '#0D1B2A' },
    s: {
      unselText: '#FFFFFF', unselBorder: '#FFFFFF',
      selBg: '#FFFFFF', selText: '#535353', selBorder: '#535353',
      hoverBg: 'rgba(255,255,255,0.22)',
      cartBg: '#FFFFFF', cartText: '#535353', cartBorder: '#535353',
      cartHoverBg: '#535353', cartHoverText: '#FFFFFF',
      confirmBg: '#535353', confirmText: '#FFFFFF',
      wishlistText: '#FFFFFF', wishlistBorder: '#FFFFFF',
      wishlistHoverBg: '#FFFFFF', wishlistHoverText: '#535353', wishlistHoverBorder: '#535353'
    },
    pp: {
      selBg: '#FBD9E1', selText: null, selBorder: null,
      hoverBg: 'rgba(251,217,225,0.22)',
      confirmBg: '#FBD9E1', confirmText: null,
      wishlistHoverBg: '#FBD9E1', wishlistHoverText: null, wishlistHoverBorder: null
    }
  };

  var PC_MOD_COLORS = {
    stoic: {
      selBg: '#000000', selText: '#FFFFFF', selBorder: '#FFFFFF',
      hoverBg: 'rgba(0,0,0,0.22)',
      confirmBg: '#000000', confirmText: '#FFFFFF',
      wishlistHoverBg: '#000000', wishlistHoverText: '#FFFFFF', wishlistHoverBorder: '#FFFFFF'
    },
    grain: {
      selBg: '#F0D9B5', selText: null, selBorder: '#0D1B2A',
      hoverBg: 'rgba(240,217,181,0.22)',
      cartBg: '#F0D9B5', cartText: '#0D1B2A', cartBorder: '#0D1B2A',
      cartHoverBg: '#B58863', cartHoverText: '#F0D9B5',
      confirmBg: '#B58863', confirmText: '#F0D9B5',
      wishlistHoverBg: '#F0D9B5', wishlistHoverText: '#B58863', wishlistHoverBorder: '#B58863'
    },
    ti: { confirmBg: '#BFEFFF', confirmText: '#0D1B2A' },
    pasture: {
      selBg: '#255525', selText: '#FFFFFF', selBorder: '#FFFFFF',
      hoverBg: 'rgba(37,85,37,0.22)',
      wishlistHoverBg: '#255525', wishlistHoverText: '#FFFFFF', wishlistHoverBorder: '#FFFFFF'
    },
    harmony: {
      selBg: '#000000', selText: '#FFFFFF', selBorder: '#FFFFFF',
      hoverBg: 'rgba(0,0,0,0.22)',
      confirmBg: '#000000', confirmText: '#FFFFFF',
      wishlistHoverBg: '#000000', wishlistHoverText: '#FFFFFF', wishlistHoverBorder: '#FFFFFF'
    }
  };

  /* Rank-5 hover name colors — per hovered variant, what color each card name becomes */
  var CB_HOVER_COLORS = {
    ww: { scrollbar: '#B58863', names: { ww: '#B58863', ic: '#F0D9B5', s: '#B58863', pp: '#F0D9B5' } },
    ic: { scrollbar: '#BFEFFF', names: { ww: '#FFFEEF', ic: '#BFEFFF', s: '#FFFEEF', pp: '#BFEFFF' } },
    s:  { scrollbar: '#535353', names: { ww: '#535353', ic: '#FFFFFF', s: '#535353', pp: '#FFFFFF' } },
    pp: { scrollbar: '#FBD9E1', names: { ww: '#FFFFFF', ic: '#FBD9E1', s: '#FFFFFF', pp: '#FBD9E1' } }
  };

  var PC_HOVER_COLORS = {
    stoic:   { scrollbar: '#000000', names: null },
    grain:   { scrollbar: '#B58863', names: { stoic: '#B58863', grain: '#F0D9B5', ti: '#B58863', pasture: '#F0D9B5', harmony: '#B58863' } },
    ti:      { scrollbar: '#BFEFFF', names: { stoic: '#FFFEEF', grain: '#BFEFFF', ti: '#FFFEEF', pasture: '#BFEFFF', harmony: '#FFFEEF' } },
    pasture: { scrollbar: '#255525', names: { stoic: '#F0D9B5', grain: '#255525', ti: '#F0D9B5', pasture: '#255525', harmony: '#F0D9B5' } },
    harmony: { scrollbar: '#FFFFFF', names: null }
  };

  /* Pieces (crewneck) line data — now under Pieces sub-line */
  var PIECES_LINE_DATA = {
    stoic:   { id: 'stoic',   name: 'Stoic',    colors: ['#FFFFFF','#000000'], colorways: ['FFFFFF','F0D9B5','B58863','D4AF37','FBD9E1'] },
    grain:   { id: 'grain',   name: 'Grain',    colors: ['#F0D9B5','#B58863'], colorways: ['FFFFFF','B58863','D4AF37','FBD9E1'] },
    ti:      { id: 'ti',      name: 'Thin Ice', colors: ['#BFEFFF','#FFFEEF'], colorways: ['FFFFFF','F0D9B5','B58863','D4AF37','FBD9E1'] },
    pasture: { id: 'pasture', name: 'Pasture',  colors: ['#255525','#F0D9B5'], colorways: ['FFFFFF','F0D9B5','B58863','D4AF37','FBD9E1'] },
    harmony: { id: 'harmony', name: 'Harmony',  colors: ['#000000','#FFFFFF'], colorways: ['F0D9B5','B58863','D4AF37','FBD9E1'] }
  };
  var PIECES_LINE_KEYS = ['stoic','grain','ti','pasture','harmony'];

  var COLLECTIONS = [
    {
      id: 'first-move',
      name: 'First Move',
      description: 'Limited and Exclusive. For those bold enough to make the First Move.',
      badge: 'Coming Soon',
      thumbnail: null,  // cycles dynamically
      subLines: ['chessboards', 'pieces']
    },
    { id: 'engine',     name: 'Engine',     description: '', badge: 'Coming Soon', subLines: [] },
    { id: 'promotions', name: 'Promotions', description: '', badge: 'Coming Soon', subLines: [] },
    { id: 'najdorf',    name: 'Najdorf',    description: '', badge: 'Coming Soon', subLines: [] }
  ];

  /* ══════════════════════════════════════════════════
     DOM REFERENCES
  ══════════════════════════════════════════════════ */
  var board          = document.getElementById('chess-board');
  var siteHeader     = document.getElementById('site-header');
  var menuToggle     = document.getElementById('menu-toggle');
  var mobileOverlay  = document.getElementById('mobile-overlay');
  var cartTrigger    = document.getElementById('cart-trigger');
  var cartClose      = document.getElementById('cart-close');
  var cartDrawer     = document.getElementById('cart-drawer');
  var cartBackdrop   = document.getElementById('cart-backdrop');
  var cartCountEl    = document.getElementById('cart-count');
  var cartItemsEl    = document.getElementById('cart-items');
  var cartFooter     = document.getElementById('cart-footer');
  var cartSubtotal   = document.getElementById('cart-subtotal-amount');
  var checkoutBtn    = document.getElementById('checkout-btn');
  var navDots        = document.querySelectorAll('.rank-nav-dot');
  var collectionsTrack = document.getElementById('collections-track');
  var carouselPrev   = document.getElementById('carousel-prev');
  var carouselNext   = document.getElementById('carousel-next');
  var rank4Content   = document.getElementById('rank-4-content');
  var rank5Content   = document.getElementById('rank-5-content');
  var rank6Content   = document.getElementById('rank-6-content');
  var rank7Contact   = document.getElementById('rank-7-contact');
  var rank7Checkout  = document.getElementById('rank-7-checkout');
  var rank8Page      = document.getElementById('rank-8');
  var rank8ContactConfirm = document.getElementById('rank-8-contact-confirm');
  var rank8OrderConfirm   = document.getElementById('rank-8-order-confirm');
  var contactForm    = document.getElementById('contact-form');
  var placeOrderBtn  = document.getElementById('place-order-btn');
  var continueShopBtn = document.getElementById('continue-shopping-btn');
  var footerYear     = document.getElementById('footer-year');

  /* Breadcrumbs */
  var bc4 = document.getElementById('breadcrumb-4');
  var bc5 = document.getElementById('breadcrumb-5');
  var bc6 = document.getElementById('breadcrumb-6');

  /* Sections in scroll order */
  var SECTIONS = ['landing', 'rank-3', 'rank-4', 'rank-5', 'rank-6', 'rank-7', 'rank-8'];

  /* ══════════════════════════════════════════════════
     UTILITY
  ══════════════════════════════════════════════════ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function raf(fn) { return window.requestAnimationFrame(fn); }

  function formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2).replace('.00', '');
  }

  function formatDollar(dollars) {
    return '$' + dollars.toFixed(2).replace('.00', '');
  }

  /* Mapping of line IDs to their exact image prefix (case-sensitive) */
  var LINE_IMAGE_PREFIX = {
    stoic:   'Stoic',
    grain:   'Grain',
    ti:      'TI',
    pasture: 'Pasture',
    harmony: 'Harmony'
  };

  function getProductImagePath(line, piece, colorway) {
    var lineId = LINE_IMAGE_PREFIX[line] || (line.charAt(0).toUpperCase() + line.slice(1));
    return 'images/products/first_move/pieces/pieces_' + lineId + '.' + piece + '.' + colorway + '.jpg';
  }

  function getProductPNGPath(line, piece, colorway) {
    var lineId = LINE_IMAGE_PREFIX[line] || (line.charAt(0).toUpperCase() + line.slice(1));
    var base = 'pieces_' + lineId + '.' + piece + '.' + colorway;
    return 'images/products/first_move/pieces/' + base + '/resource/0.png';
  }

  function getChessboardImagePath(variant, piece, location) {
    var shot = (location === 'sl') ? '3' : (location === 'sr') ? '2' : '1';
    // Knight on left/right chest uses all-underscore filename (chessboards_ww_knight_l_1.jpg)
    if (piece === 'knight' && (location === 'l' || location === 'r')) {
      return 'images/products/first_move/chessboards/chessboards_' + variant + '_knight_' + location + '_' + shot + '.jpg';
    }
    return 'images/products/first_move/chessboards/chessboards_' + variant + '.' + piece + '.' + location + '_' + shot + '.jpg';
  }

  // Direct JPG at chessboards root — works on all platforms including mobile
  function getChessboardJPGPath(variant, piece, location, shot) {
    shot = shot || '1';
    if (piece === 'knight' && (location === 'l' || location === 'r')) {
      return 'images/products/first_move/chessboards/chessboards_' + variant + '_knight_' + location + '_' + shot + '.jpg';
    }
    return 'images/products/first_move/chessboards/chessboards_' + variant + '.' + piece + '.' + location + '_' + shot + '.jpg';
  }

  // Path to PNG inside CLO viewer folder (desktop cycler only)
  function getChessboardPNGPath(variant, piece, location, shot) {
    shot = shot || '1';
    var folder, filename;
    if (piece === 'knight' && (location === 'l' || location === 'r')) {
      folder   = 'chessboards_' + variant + '_knight_' + location;
      filename = variant + '_knight_' + location + '_' + shot + '.png';
    } else {
      folder   = 'chessboards_' + variant + '.' + piece + '.' + location;
      filename = variant + '.' + piece + '.' + location + '_' + shot + '.png';
    }
    return 'images/products/first_move/chessboards/' + folder + '/resource/' + filename;
  }

  // Path to CLO interactive HTML viewer
  function getChessboardViewerPath(variant, piece, location) {
    var folder;
    if (piece === 'knight' && (location === 'l' || location === 'r')) {
      folder = 'chessboards_' + variant + '_knight_' + location;
    } else {
      folder = 'chessboards_' + variant + '.' + piece + '.' + location;
    }
    return 'images/products/first_move/chessboards/' + folder + '/' + folder + '.html';
  }

  function sanitize(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ══════════════════════════════════════════════════
     IMAGE POOL (all product images for cycling)
  ══════════════════════════════════════════════════ */
  function buildImagePool() {
    var pool = [];

    // Chessboard images: direct JPGs at root level (_1 front-view only for pool)
    CHESSBOARD_VARIANTS_LIST.forEach(function(variant) {
      CHESSBOARD_PIECES_CB.forEach(function(piece) {
        CHESSBOARD_LOCATION_KEYS.forEach(function(loc) {
          pool.push(getChessboardJPGPath(variant, piece, loc, '1'));
        });
      });
    });

    // Pieces images: use PNGs inside CLO viewer folders
    PIECES_LINE_KEYS.forEach(function(lineKey) {
      var lineData = PIECES_LINE_DATA[lineKey];
      var linePrefix = LINE_IMAGE_PREFIX[lineKey];
      ['P','B','N','R','Q','K'].forEach(function(piece) {
        lineData.colorways.forEach(function(cw) {
          var base = 'pieces_' + linePrefix + '.' + piece + '.' + cw;
          pool.push('images/products/first_move/pieces/' + base + '/resource/0.png');
        });
      });
    });

    return pool;
  }

  var IMAGE_POOL = null;

  function getImagePool() {
    if (!IMAGE_POOL) IMAGE_POOL = buildImagePool();
    return IMAGE_POOL;
  }

  function buildPiecePNGPool() {
    var pool = [];
    PIECES_LINE_KEYS.forEach(function(lineKey) {
      var lineData = PIECES_LINE_DATA[lineKey];
      var linePrefix = LINE_IMAGE_PREFIX[lineKey];
      ['P','B','N','R','Q','K'].forEach(function(piece) {
        lineData.colorways.forEach(function(cw) {
          var base = 'pieces_' + linePrefix + '.' + piece + '.' + cw;
          pool.push('images/products/first_move/pieces/' + base + '/resource/0.png');
        });
      });
    });
    return pool;
  }

  var PIECE_PNG_POOL = null;

  function getPiecePNGPool() {
    if (!PIECE_PNG_POOL) PIECE_PNG_POOL = buildPiecePNGPool();
    return PIECE_PNG_POOL;
  }

  // Shot-1 (front view) JPG for every chessboard variant/piece/location
  function buildChessboardPNGPool() {
    var pool = [];
    CHESSBOARD_VARIANTS_LIST.forEach(function(variant) {
      CHESSBOARD_PIECES_CB.forEach(function(piece) {
        CHESSBOARD_LOCATION_KEYS.forEach(function(loc) {
          pool.push(getChessboardJPGPath(variant, piece, loc, '1'));
        });
      });
    });
    return pool;
  }

  var CHESSBOARD_PNG_POOL = null;

  function getChessboardPNGPool() {
    if (!CHESSBOARD_PNG_POOL) CHESSBOARD_PNG_POOL = buildChessboardPNGPool();
    return CHESSBOARD_PNG_POOL;
  }

  /* ══════════════════════════════════════════════════
     LANDING IMAGE CYCLER
  ══════════════════════════════════════════════════ */
  function initLandingImageCycler() {
    var cyclingBgs = document.querySelectorAll('.sq-cycling-bg');
    if (!cyclingBgs.length) return;

    var pool = getImagePool();

    function pickRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function loadAndShow(bgEl, retries) {
      retries = retries || 0;
      if (retries > 4) return; // stop after 4 failed attempts
      var src = pickRandom(pool);
      var img = new Image();
      img.onload = function() {
        bgEl.classList.remove('visible');
        setTimeout(function() {
          bgEl.style.backgroundImage = 'url(' + src + ')';
          bgEl.classList.add('visible');
        }, 300);
      };
      img.onerror = function() {
        loadAndShow(bgEl, retries + 1);
      };
      img.src = src;
    }

    // Initial load with staggered start
    cyclingBgs.forEach(function(bgEl, i) {
      setTimeout(function() {
        loadAndShow(bgEl);
        setInterval(function() { loadAndShow(bgEl); }, 6000 + i * 400);
      }, i * 800);
    });
  }

  /* ══════════════════════════════════════════════════
     ELEMENT IMAGE CYCLER HELPER
  ══════════════════════════════════════════════════ */
  // initialPool: optional array of preferred images to try first on the very first cycle
  function startElementCycler(bgEl, pool, intervalMs, initialPool) {
    if (!bgEl || !pool || !pool.length) return null;

    // Clear any existing cycler on this element — prevents interval stacking
    // when renderGarmentLines() is called multiple times on the same el.
    if (bgEl._cyclerInterval) {
      clearInterval(bgEl._cyclerInterval);
      bgEl._cyclerInterval = null;
    }

    var firstCycle = true;

    function shuffled(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function loadAndShow() {
      // On first cycle, prefer initialPool candidates (e.g. front-facing shots)
      var candidates = (firstCycle && initialPool && initialPool.length)
        ? shuffled(initialPool).concat(shuffled(pool)).slice(0, 12)
        : shuffled(pool).slice(0, 12);
      firstCycle = false;
      var attempt = 0;

      function tryNext() {
        if (attempt >= candidates.length) return;
        var src = candidates[attempt++];
        var img = new Image();
        img.onload = function() {
          bgEl.classList.remove('visible');
          setTimeout(function() {
            bgEl.style.backgroundImage = 'url(' + src + ')';
            bgEl.classList.add('visible');
          }, 300);
        };
        img.onerror = tryNext;
        img.src = src;
      }
      tryNext();
    }

    loadAndShow();
    bgEl._cyclerInterval = setInterval(loadAndShow, intervalMs || 6000);
    return bgEl._cyclerInterval;
  }

  // ── Garment preview zoom (wheel / pinch / buttons / drag) ──────────────
  function initPreviewZoom() {
    var col  = document.getElementById('cb-image-col');
    var wrap = document.getElementById('cb-preview-zoom-wrap');
    if (!col || !wrap) return;

    var scale = 1, tx = 0, ty = 0;
    var MIN = 1, MAX = 4;

    function applyTransform(animate) {
      wrap.style.transition = animate ? 'transform 0.18s ease' : 'none';
      wrap.style.transform  = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }

    function clamp() {
      var W = col.offsetWidth, H = col.offsetHeight;
      tx = Math.min(0, Math.max(W * (1 - scale), tx));
      ty = Math.min(0, Math.max(H * (1 - scale), ty));
    }

    function zoomAt(cx, cy, newScale, animate) {
      newScale = Math.min(MAX, Math.max(MIN, newScale));
      var ratio = newScale / scale;
      tx = cx - ratio * (cx - tx);
      ty = cy - ratio * (cy - ty);
      scale = newScale;
      if (scale === MIN) { tx = 0; ty = 0; }
      clamp();
      applyTransform(animate !== false);
      syncButtons();
    }

    function syncButtons() {
      var btnIn  = col.querySelector('.cb-zoom-in');
      var btnOut = col.querySelector('.cb-zoom-out');
      if (btnIn)  btnIn.disabled  = scale >= MAX;
      if (btnOut) btnOut.disabled = scale <= MIN;
      wrap.style.cursor = scale > MIN ? 'grab' : 'default';
    }

    // +/- buttons — zoom toward center
    col.querySelector('.cb-zoom-in').addEventListener('click', function() {
      zoomAt(col.offsetWidth / 2, col.offsetHeight / 2, scale * 1.5);
    });
    col.querySelector('.cb-zoom-out').addEventListener('click', function() {
      zoomAt(col.offsetWidth / 2, col.offsetHeight / 2, scale / 1.5);
    });

    // Mouse wheel
    col.addEventListener('wheel', function(e) {
      e.preventDefault();
      var rect  = col.getBoundingClientRect();
      var delta = e.deltaY < 0 ? 1.12 : (1 / 1.12);
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, scale * delta, false);
    }, { passive: false });

    // Touch pinch-to-zoom + single-finger pan when zoomed
    var pinchDist = 0;
    var touchDrag = false, touchDragX = 0, touchDragY = 0, startTouchTx = 0, startTouchTy = 0;

    col.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        pinchDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        touchDrag = false;
      } else if (e.touches.length === 1 && scale > MIN) {
        touchDrag   = true;
        touchDragX  = e.touches[0].clientX;
        touchDragY  = e.touches[0].clientY;
        startTouchTx = tx;
        startTouchTy = ty;
      }
    }, { passive: true });

    col.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2 && pinchDist) {
        e.preventDefault();
        var dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        var rect = col.getBoundingClientRect();
        var midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        var midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        zoomAt(midX, midY, scale * (dist / pinchDist), false);
        pinchDist = dist;
      } else if (e.touches.length === 1 && touchDrag) {
        e.preventDefault();
        tx = startTouchTx + (e.touches[0].clientX - touchDragX);
        ty = startTouchTy + (e.touches[0].clientY - touchDragY);
        clamp();
        applyTransform(false);
      }
    }, { passive: false });

    col.addEventListener('touchend', function(e) {
      if (e.touches.length < 2) pinchDist = 0;
      if (e.touches.length === 0) touchDrag = false;
    });

    // Mouse drag when zoomed in
    var dragging = false, dragX, dragY, startTx, startTy;
    wrap.addEventListener('mousedown', function(e) {
      if (scale <= MIN) return;
      dragging = true; dragX = e.clientX; dragY = e.clientY;
      startTx = tx; startTy = ty;
      wrap.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      tx = startTx + (e.clientX - dragX);
      ty = startTy + (e.clientY - dragY);
      clamp();
      applyTransform(false);
    });
    window.addEventListener('mouseup', function() {
      if (!dragging) return;
      dragging = false;
      wrap.style.cursor = scale > MIN ? 'grab' : 'default';
    });

    syncButtons();
  }

  // Continuous ticker-style scroll; pauses on scrollbar interaction and touch
  function startCardAutoScroll(container) {
    // Cancel any previously running loop on this container to prevent speed accumulation
    if (container._scrollStop) { container._scrollStop(); }

    var speed = 0.5;
    var paused = false;
    var stopped = false;
    var rafId = null;
    var resumeTimer = null;

    function pause() { paused = true; clearTimeout(resumeTimer); }
    function resume(delay) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function() { paused = false; }, delay || 0);
    }

    // ── Custom DOM scrollbar (always rendered, never paint-deferred) ──
    var rank5El = document.getElementById('rank-5');
    // Remove any leftover scrollbar from a previous render
    var old = rank5El && rank5El.querySelector('.rank5-scrollbar');
    if (old) old.parentNode.removeChild(old);

    var track = document.createElement('div');
    track.className = 'rank5-scrollbar';
    var thumb = document.createElement('div');
    thumb.className = 'rank5-scrollbar-thumb';
    track.appendChild(thumb);
    if (rank5El) rank5El.appendChild(track);

    function updateThumb() {
      var maxLeft = container.scrollWidth - container.clientWidth;
      var trackW  = track.offsetWidth;
      // If layout not ready yet, show a placeholder thumb so the bar is visible
      if (maxLeft <= 0 || !trackW) {
        if (!thumb.style.width) thumb.style.width = '40px';
        return;
      }
      var thumbW  = Math.max(trackW * (container.clientWidth / container.scrollWidth), 40);
      var offset  = (container.scrollLeft / maxLeft) * (trackW - thumbW);
      thumb.style.width     = thumbW + 'px';
      thumb.style.transform = 'translateX(' + offset + 'px)';
    }

    // Thumb drag — moves the scrollbar and controls scroll position
    var thumbDrag = false, thumbStartX = 0, thumbStartScroll = 0;
    thumb.addEventListener('mousedown', function(e) {
      thumbDrag = true;
      thumbStartX = e.pageX;
      thumbStartScroll = container.scrollLeft;
      pause();
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('mousemove', function(e) {
      if (!thumbDrag) return;
      var maxLeft = container.scrollWidth - container.clientWidth;
      var thumbW  = thumb.offsetWidth;
      var trackW  = track.offsetWidth;
      if (trackW - thumbW <= 0) return;
      container.scrollLeft = thumbStartScroll + (e.pageX - thumbStartX) * (maxLeft / (trackW - thumbW));
    });
    window.addEventListener('mouseup', function() {
      if (!thumbDrag) return;
      thumbDrag = false;
      resume(1500);
    });

    // ── Ticker RAF loop ──────────────────────────────────────────────
    function tick() {
      if (stopped) return;
      if (!paused) {
        var maxLeft = container.scrollWidth - container.clientWidth;
        if (maxLeft > 0) {
          if (container.scrollLeft >= maxLeft - 1) {
            container.scrollLeft = 0;
            resume(5000); // 5s pause at the wrap point before looping again
          } else {
            container.scrollLeft += speed;
          }
        }
      }
      updateThumb();
      rafId = requestAnimationFrame(tick);
    }
    // Initial delay before scroll begins
    resume(500);
    rafId = requestAnimationFrame(tick);

    // Expose a stop handle so the next call to startCardAutoScroll can kill this loop
    container._scrollStop = function() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      container._scrollStop = null;
    };

    // ── Ensure thumb initializes when rank-5 enters viewport ──────────
    // The first RAF may fire before the browser computes layout for an
    // off-screen scroll-snap section; use IntersectionObserver + timeouts
    // as a belt-and-suspenders guarantee that the thumb gets its width.
    if (window.IntersectionObserver && rank5El) {
      var thumbObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            updateThumb();
            // On mobile, a touch event during the snap-scroll transition may have
            // called pause(). Kick-start auto-scroll once the section is visible.
            if (paused && !thumbDrag) { resume(300); }
          }
        });
      }, { threshold: 0.1 });
      thumbObs.observe(rank5El);
    }
    // Fallback timeouts in case IntersectionObserver fires late or is unsupported
    setTimeout(updateThumb, 150);
    setTimeout(updateThumb, 600);

    // Touch swipe
    container.addEventListener('touchstart', pause, { passive: true });
    container.addEventListener('touchend', function() { resume(2000); });
  }

  /* ══════════════════════════════════════════════════
     RANK BACKGROUND COLOR UPDATE
  ══════════════════════════════════════════════════ */
  function getContrastColor(hex) {
    // Returns black or white based on relative luminance of the hex color
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  // Returns a UI-safe foreground color guaranteed to be readable on bgHex.
  // Light panels get brand dark; dark panels try the palette color, falling back to ivory.
  function safeUiColor(bgHex, paletteHex) {
    var r  = parseInt(bgHex.slice(1,3),16)/255, g  = parseInt(bgHex.slice(3,5),16)/255, b  = parseInt(bgHex.slice(5,7),16)/255;
    var bgLum = 0.2126*r + 0.7152*g + 0.0722*b;
    if (bgLum > 0.5) return '#0D1B2A';
    var pr = parseInt(paletteHex.slice(1,3),16)/255, pg = parseInt(paletteHex.slice(3,5),16)/255, pb = parseInt(paletteHex.slice(5,7),16)/255;
    var pLum  = 0.2126*pr + 0.7152*pg + 0.0722*pb;
    var ratio = (Math.max(bgLum,pLum)+0.05) / (Math.min(bgLum,pLum)+0.05);
    return ratio >= 3 ? paletteHex : '#B8CDD8';
  }

  // Pick the most "characteristic" palette color for use as a UI accent (buttons, selections).
  // Scores each color by chroma × (1 - luminance): prefers saturated and/or dark colors.
  // Exception: when darkHex is near-black (lum < 0.015), prefer lightHex as the button accent
  // so it reads clearly against the dark controls panel (e.g. Stoic → white button).
  function pickAccentColor(lightHex, darkHex) {
    function lum(hex) {
      var r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
      return 0.2126*r + 0.7152*g + 0.0722*b;
    }
    function score(hex) {
      var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      return (Math.max(r,g,b) - Math.min(r,g,b)) * (1 - lum(hex));
    }
    // Near-black dark square → use the light color so button contrasts against dark bg
    if (lum(darkHex) < 0.015) return lightHex;
    var sL = score(lightHex), sD = score(darkHex);
    if (sL === 0 && sD === 0) return lum(lightHex) <= lum(darkHex) ? lightHex : darkHex;
    return sD >= sL ? darkHex : lightHex;
  }

  function hexToRgbStr(hex) {
    return parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16);
  }

  function updateRankColors(rankEl, lightHex, darkHex) {
    if (!rankEl) return;
    rankEl.style.setProperty('--sq-light-override', lightHex);
    rankEl.style.setProperty('--sq-dark-override',  darkHex);
    // Side label: raw palette hex (outline handles low-contrast cases)
    rankEl.style.setProperty('--text-on-light', darkHex);
    rankEl.style.setProperty('--text-on-dark',  lightHex);
    rankEl.style.setProperty('--label-outline-light', getContrastColor(lightHex));
    rankEl.style.setProperty('--label-outline-dark',  getContrastColor(darkHex));
    // UI elements (buttons, icons, labels): always contrast-safe
    rankEl.style.setProperty('--ui-text-dark',  safeUiColor(darkHex,  lightHex));
    rankEl.style.setProperty('--ui-text-light', safeUiColor(lightHex, darkHex));
    // Accent color: drives button bg, selection borders — picks most characteristic palette color
    var accent = pickAccentColor(lightHex, darkHex);
    rankEl.style.setProperty('--rank-accent',        accent);
    rankEl.style.setProperty('--rank-accent-text',   getContrastColor(accent));
    var rgb = hexToRgbStr(accent);
    rankEl.style.setProperty('--rank-accent-15',     'rgba(' + rgb + ',0.15)');
    rankEl.style.setProperty('--rank-accent-shadow', 'rgba(' + rgb + ',0.35)');
  }

  function clearRankColors(rankEl) {
    if (!rankEl) return;
    rankEl.style.removeProperty('--sq-light-override');
    rankEl.style.removeProperty('--sq-dark-override');
    rankEl.style.removeProperty('--text-on-light');
    rankEl.style.removeProperty('--text-on-dark');
    rankEl.style.removeProperty('--label-outline-light');
    rankEl.style.removeProperty('--label-outline-dark');
    rankEl.style.removeProperty('--ui-text-dark');
    rankEl.style.removeProperty('--ui-text-light');
    rankEl.style.removeProperty('--rank-accent');
    rankEl.style.removeProperty('--rank-accent-text');
    rankEl.style.removeProperty('--rank-accent-15');
    rankEl.style.removeProperty('--rank-accent-shadow');
  }

  var MOD_COLOR_VARS = [
    '--mod-sel-bg','--mod-sel-text','--mod-sel-border',
    '--mod-unsel-text','--mod-unsel-border','--mod-hover-bg',
    '--mod-cart-bg','--mod-cart-text','--mod-cart-border',
    '--mod-cart-hover-bg','--mod-cart-hover-text',
    '--mod-confirm-bg','--mod-confirm-text',
    '--mod-wishlist-text','--mod-wishlist-border',
    '--mod-wishlist-hover-bg','--mod-wishlist-hover-text','--mod-wishlist-hover-border'
  ];

  function applyModColors(rankEl, scheme) {
    if (!rankEl) return;
    // Clear all mod vars first
    MOD_COLOR_VARS.forEach(function(v) { rankEl.style.removeProperty(v); });
    if (!scheme) return;
    if (scheme.selBg)              rankEl.style.setProperty('--mod-sel-bg',              scheme.selBg);
    if (scheme.selText)            rankEl.style.setProperty('--mod-sel-text',            scheme.selText);
    if (scheme.selBorder)          rankEl.style.setProperty('--mod-sel-border',          scheme.selBorder);
    if (scheme.unselText)          rankEl.style.setProperty('--mod-unsel-text',          scheme.unselText);
    if (scheme.unselBorder)        rankEl.style.setProperty('--mod-unsel-border',        scheme.unselBorder);
    if (scheme.hoverBg)            rankEl.style.setProperty('--mod-hover-bg',            scheme.hoverBg);
    if (scheme.cartBg)             rankEl.style.setProperty('--mod-cart-bg',             scheme.cartBg);
    if (scheme.cartText)           rankEl.style.setProperty('--mod-cart-text',           scheme.cartText);
    if (scheme.cartBorder)         rankEl.style.setProperty('--mod-cart-border',         scheme.cartBorder);
    if (scheme.cartHoverBg)        rankEl.style.setProperty('--mod-cart-hover-bg',       scheme.cartHoverBg);
    if (scheme.cartHoverText)      rankEl.style.setProperty('--mod-cart-hover-text',     scheme.cartHoverText);
    if (scheme.confirmBg)          rankEl.style.setProperty('--mod-confirm-bg',          scheme.confirmBg);
    if (scheme.confirmText)        rankEl.style.setProperty('--mod-confirm-text',        scheme.confirmText);
    if (scheme.wishlistText)       rankEl.style.setProperty('--mod-wishlist-text',       scheme.wishlistText);
    if (scheme.wishlistBorder)     rankEl.style.setProperty('--mod-wishlist-border',     scheme.wishlistBorder);
    if (scheme.wishlistHoverBg)    rankEl.style.setProperty('--mod-wishlist-hover-bg',   scheme.wishlistHoverBg);
    if (scheme.wishlistHoverText)  rankEl.style.setProperty('--mod-wishlist-hover-text', scheme.wishlistHoverText);
    if (scheme.wishlistHoverBorder) rankEl.style.setProperty('--mod-wishlist-hover-border', scheme.wishlistHoverBorder);
  }

  /* ══════════════════════════════════════════════════
     SCROLL NAVIGATION
  ══════════════════════════════════════════════════ */
  function scrollToSection(id, behavior, callback) {
    var el = document.getElementById(id);
    if (!el) return;
    // Calculate the true snap target position.
    // Desktop uses scroll-padding-top on the container; mobile uses scroll-margin-top
    // on the element. Both shift the effective snap point up by header-h. Reading
    // both and taking whichever is non-zero gives us the correct offset on any device.
    var padTop    = parseInt(getComputedStyle(board).scrollPaddingTop, 10) || 0;
    var marginTop = parseInt(getComputedStyle(el).scrollMarginTop,  10) || 0;
    var snapOffset = padTop || marginTop;
    var targetY = el.offsetTop - snapOffset;

    // Use board.scrollTop directly — scrollIntoView is unreliable on iOS Safari
    // inside scroll-snap containers. Suspend scroll-snap during animation so
    // the snap engine doesn't fight the rAF loop (causes jank on iOS).
    if (behavior === 'instant') {
      board.style.scrollSnapType = 'none';
      // scrollTo({ behavior:'instant' }) overrides CSS scroll-behavior:smooth per spec,
      // unlike setting scrollTop directly which the browser still animates.
      board.scrollTo({ top: targetY, behavior: 'instant' });
      if (window.innerWidth <= 767) { applyMobileSnap(); } else { board.style.scrollSnapType = ''; }
      if (callback) callback();
    } else if (window.innerWidth <= 767) {
      // On mobile, use the browser's own smooth scroll — avoids the rAF loop
      // fighting iOS's scroll engine and causing per-frame micro-jank.
      STATE.isAnimating = true;
      board.style.scrollSnapType = 'none';
      board.scrollTo({ top: targetY, behavior: 'smooth' });
      setTimeout(function() {
        STATE.isAnimating = false;
        STATE.currentSection = id;
        updateNavDots(id);
        updateHeader(id);
        applyMobileSnap();
        if (callback) callback();
      }, 700);
    } else {
      STATE.isAnimating = true;
      board.style.scrollSnapType = 'none';
      smoothScrollTo(targetY, 600, function() {
        STATE.isAnimating = false;
        // Manually sync section state — observer is suppressed during animation
        STATE.currentSection = id;
        updateNavDots(id);
        updateHeader(id);
        board.style.scrollSnapType = '';
        if (callback) callback();
      });
    }
  }

  /**
   * Smooth eased scroll to an absolute Y position on the board.
   * Uses ease-in-out-quad so movement feels natural.
   */
  function smoothScrollTo(targetY, duration, callback) {
    var startY = board.scrollTop;
    var diff   = targetY - startY;
    var startTime = null;

    function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function step(ts) {
      if (!startTime) startTime = ts;
      var elapsed  = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      board.scrollTo({ top: startY + diff * ease(progress), behavior: 'instant' });
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (callback) callback();
      }
    }
    requestAnimationFrame(step);
  }

  /**
   * Bypass ranks 4-6 with a continuous glide, giving the sense of
   * a piece advancing through the board rather than a jarring jump.
   */
  function bypassMiddleRanks(direction, callback) {
    if (STATE.isBypassing) return;
    STATE.isBypassing = true;

    var bypassRanks   = direction === 'down' ? ['rank-4','rank-5','rank-6'] : ['rank-6','rank-5','rank-4'];
    var targetSection = direction === 'down' ? 'rank-7' : 'rank-3';

    // Only reveal bypassed ranks in shopping mode — in default mode they're
    // empty (no content rendered) and showing blank dark squares is confusing.
    if (STATE.mode !== 'default') {
      bypassRanks.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.removeAttribute('hidden');
      });
    }

    // Suspend scroll-snap so the programmatic scroll moves freely
    board.style.scrollSnapType = 'none';

    var targetEl  = document.getElementById(targetSection);
    var padTop    = parseInt(getComputedStyle(board).scrollPaddingTop, 10) || 0;
    var marginTop = targetEl ? (parseInt(getComputedStyle(targetEl).scrollMarginTop, 10) || 0) : 0;
    var snapOffset = padTop || marginTop;
    var targetY  = targetEl ? targetEl.offsetTop - snapOffset : 0;

    // Glide to destination — use native smooth on mobile to avoid RAF-loop jank
    function onBypassComplete() {
      // Re-hide middle ranks BEFORE restoring snap — otherwise y:mandatory
      // can grab a temporarily-visible bypass rank during the brief window
      // between snap restore and rank hide.
      if (STATE.mode === 'default') {
        bypassRanks.forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.setAttribute('hidden', '');
        });
      }
      STATE.isBypassing = false;
      STATE.currentSection = targetSection;
      updateNavDots(targetSection);
      updateHeader(targetSection);
      if (window.innerWidth <= 767) {
        applyMobileSnap();
      } else {
        board.style.scrollSnapType = '';
      }
      if (callback) callback();
    }

    if (window.innerWidth <= 767) {
      board.scrollTo({ top: targetY, behavior: 'smooth' });
      setTimeout(onBypassComplete, 900);
    } else {
      smoothScrollTo(targetY, 900, onBypassComplete);
    }
  }

  /**
   * Intercept scroll to implement bypass logic.
   * In default mode: rank-3 → rank-7 (bypassing 4-6)
   * In default mode: rank-7 → rank-3 (bypassing 6-5-4)
   */
  var lastWheelTime = 0;
  var wheelCooldown = 1200; // ms — longer than both the 600ms scroll and 900ms bypass animations

  // Visible sections in default mode (ranks 4-6 hidden, rank-8 hidden)
  var DEFAULT_SECTIONS = ['landing', 'rank-3', 'rank-7'];

  function handleWheel(e) {
    // Always block native scroll during programmatic animation.
    // Without this, rapid trackpad events fight the animation and cause flashing.
    if (STATE.isBypassing || STATE.isAnimating) {
      e.preventDefault();
      return;
    }

    if (STATE.mode !== 'default') return; // shopping mode: native scroll handles it

    // Ignore sub-threshold trackpad micro-scrolls
    if (Math.abs(e.deltaY) < 10) return;

    var now = Date.now();
    // During cooldown: suppress native scroll so the same gesture can't jump
    // a second page. This is the key fix for trackpad 2-page skips.
    if (now - lastWheelTime < wheelCooldown) {
      e.preventDefault();
      return;
    }

    var direction = e.deltaY > 0 ? 'down' : 'up';

    // Bypass cases
    if (STATE.currentSection === 'rank-3' && direction === 'down') {
      e.preventDefault();
      lastWheelTime = now;
      bypassMiddleRanks('down');
      return;
    }
    if (STATE.currentSection === 'rank-7' && direction === 'up') {
      e.preventDefault();
      lastWheelTime = now;
      bypassMiddleRanks('up');
      return;
    }

    // All other default-mode sections (landing ↔ rank-3, rank-7 ↔ rank-8 etc.):
    // take full control so CSS snap momentum can't skip two sections at once.
    var idx = DEFAULT_SECTIONS.indexOf(STATE.currentSection);
    if (idx === -1) return;
    var nextIdx = direction === 'down' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= DEFAULT_SECTIONS.length) return;
    e.preventDefault();
    lastWheelTime = now;
    scrollToSection(DEFAULT_SECTIONS[nextIdx], 'smooth');
  }

  /* ══════════════════════════════════════════════════
     SECTION VISIBILITY OBSERVER
  ══════════════════════════════════════════════════ */
  var sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      // Suppress mid-animation: state is pushed manually in the animation callback
      // to avoid nav dot flicker and header flash during bypass/scroll.
      if (STATE.isBypassing || STATE.isAnimating) return;
      var id = entry.target.id || 'landing';
      if (!id) return;
      STATE.currentSection = id;
      updateNavDots(id);
      updateHeader(id);

      // Trigger entrance animations
      triggerEntranceAnims(entry.target);
    });
  }, {
    root: board,
    threshold: 0.5
  });

  // Separate snap-toggle observer for rank-7/rank-8 on mobile.
  /* Observe all navigable sections */
  function initObservers() {
    SECTIONS.forEach(function(id) {
      var el = id === 'landing' ? document.getElementById('landing') : document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  // Scroll-position-based snap toggle for mobile.
  // IntersectionObserver cannot reliably handle this because:
  //   (a) rank-7 is height:auto (can be taller than 2× viewport), so threshold:0.5
  //       would never trigger, and
  //   (b) when isBypassing guards the observer callback, the "enter" event is
  //       consumed and never re-fires after the animation completes.
  // Instead, on every scroll frame we check whether scrollTop is within one
  // viewport of rank-7's snap-top — if so, disable snap; otherwise restore it.
  // This also creates natural hysteresis: snap only re-enables after the user
  // has scrolled a full viewport away from rank-7, preventing the "snap re-locks
  // immediately" problem when exiting rank-7 upward.
  var applyMobileSnap = function() {};  // reassigned by initMobileSnapToggle

  function initMobileSnapToggle() {
    if (window.innerWidth > 767) return;
    var rank7El = document.getElementById('rank-7');
    if (!rank7El) return;

    // rAF token — batches snap checks to one per animation frame so we never
    // trigger a layout recalculation more than once per frame during fast scrolls.
    var _rafPending = false;

    function applyNow() {
      _rafPending = false;
      // Never interfere while a programmatic animation is running — the animation
      // manages snap type itself and calls applyMobileSnap() when it finishes.
      if (STATE.isBypassing || STATE.isAnimating) return;
      var margin    = parseInt(getComputedStyle(rank7El).scrollMarginTop, 10) || 0;
      var rank7Top  = rank7El.offsetTop - margin;
      // Disable snap only when at/past rank-7 (30px buffer for sub-pixel rounding).
      var shouldDisable = board.scrollTop >= rank7Top - 30;
      var current = board.style.scrollSnapType;
      if (shouldDisable && current !== 'none') {
        board.style.scrollSnapType = 'none';
      } else if (!shouldDisable && current === 'none') {
        board.style.scrollSnapType = '';
      }
    }

    function apply() {
      if (_rafPending) return;
      _rafPending = true;
      requestAnimationFrame(applyNow);
    }

    board.addEventListener('scroll', apply, { passive: true });
    // Expose the immediate version so callers (bypassMiddleRanks, scrollToSection)
    // can force an instant snap-type check without waiting for a scroll event.
    applyMobileSnap = applyNow;
  }

  function updateNavDots(sectionId) {
    navDots.forEach(function(dot) {
      if (dot.classList.contains('rank-nav-dot--hidden')) return;
      dot.classList.toggle('active', dot.dataset.rank === sectionId);
    });
  }

  function showNavDot(rankId) {
    var dot = document.querySelector('.rank-nav-dot[data-rank="' + rankId + '"]');
    if (dot) {
      dot.classList.remove('rank-nav-dot--hidden');
      dot.removeAttribute('aria-hidden');
      dot.setAttribute('tabindex', '0');
    }
  }

  function resetNavDots() {
    ['rank-4', 'rank-5', 'rank-6'].forEach(function(id) {
      var dot = document.querySelector('.rank-nav-dot[data-rank="' + id + '"]');
      if (dot) {
        dot.classList.add('rank-nav-dot--hidden');
        dot.setAttribute('aria-hidden', 'true');
        dot.setAttribute('tabindex', '-1');
        dot.classList.remove('active');
      }
    });
  }

  function updateHeader(sectionId) {
    var onDark = sectionId !== 'rank-7'; // rank-7 contact has light squares
    siteHeader.classList.toggle('scrolled', sectionId !== 'landing');
  }

  function triggerEntranceAnims(section) {
    var animEls = $$('.anim-ready', section);
    animEls.forEach(function(el, i) {
      setTimeout(function() { el.classList.add('visible'); }, i * 80);
    });
  }

  /* ══════════════════════════════════════════════════
     RANK 2: INTERACTIVE PIECES (Queen + King)
  ══════════════════════════════════════════════════ */
  function initRank2() {
    var queenSq = $('.sq-queen');
    var kingSq  = $('.sq-king');

    if (queenSq) {
      queenSq.addEventListener('click', function() {
        activatePiece(queenSq, 'queen');
        STATE.navigatingFrom = 'queen';
        enterCollectionsMode();
      });
      queenSq.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          queenSq.click();
        }
      });
    }

    if (kingSq) {
      kingSq.addEventListener('click', function() {
        activatePiece(kingSq, 'king');
        STATE.navigatingFrom = 'king';
        enterContactMode();
      });
      kingSq.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          kingSq.click();
        }
      });
    }
  }

  function activatePiece(el, type) {
    el.classList.add('activated');
    setTimeout(function() { el.classList.remove('activated'); }, 600);
  }

  function enterCollectionsMode() {
    setTimeout(function() {
      scrollToSection('rank-3', 'smooth');
    }, 200);
  }

  function enterContactMode() {
    setTimeout(function() {
      showContactRank7();
      scrollToSection('rank-7', 'smooth');
    }, 200);
  }

  /* ══════════════════════════════════════════════════
     RANK 3: COLLECTIONS RENDER + CAROUSEL
  ══════════════════════════════════════════════════ */
  function getAnimatedLogoHtml(cls) {
    var targetClass = cls || 'collection-card-logo-svg';
    var src = document.querySelector('.sq-logo-img');
    if (!src) return '<img src="images/logo.svg" class="' + targetClass + '" aria-hidden="true">';
    var html = src.outerHTML
      .replace(/<defs>[\s\S]*?<\/defs>/i, '')
      .replace(/filter="url\(#streak-glow\)"/g, '')
      .replace('class="sq-logo-img"', 'class="' + targetClass + '"')
      .replace(/role="[^"]*"/, 'aria-hidden="true"')
      .replace(/aria-label="[^"]*"/, '');
    return html;
  }

  function initContactLogoWatermark() {
    var container = document.getElementById('contact-logo-watermark');
    if (!container) return;
    container.innerHTML = getAnimatedLogoHtml('contact-watermark-logo-svg');
  }

  function renderCollections() {
    if (!collectionsTrack) return;

    var logoHtml = getAnimatedLogoHtml();

    var html = COLLECTIONS.map(function(col, i) {
      var isComingSoon = !col.subLines || col.subLines.length === 0;
      var badge = col.badge ? '<span class="collection-card-badge">' + sanitize(col.badge) + '</span>' : '';

      var imgContent = col.id === 'first-move'
        ? '<div class="collection-card-cycling-bg"></div>'
        : '<div class="collection-card-logo-bg">' + logoHtml + '</div>';

      // Order: name → description → badge
      return '<div class="collection-card' + (isComingSoon ? ' collection-card-coming-soon' : '') + '" ' +
             'data-collection-id="' + sanitize(col.id) + '" ' +
             'role="button" tabindex="' + (isComingSoon ? '-1' : '0') + '" ' +
             'aria-label="' + sanitize(col.name) + ' collection">' +
             imgContent +
             '<span class="collection-card-name">' + sanitize(col.name) + '</span>' +
             '<span class="collection-card-desc">' + (col.description ? sanitize(col.description) : '') + '</span>' +
             badge +
             '</div>';
    }).join('');

    collectionsTrack.innerHTML = html;

    // Cycle First Move thumbnail alternating between chessboards and pieces
    var cyclingBgEl = collectionsTrack.querySelector('.collection-card-cycling-bg');
    if (cyclingBgEl) {
      var cbPool = getChessboardPNGPool();
      var pcPool = getPiecePNGPool();
      var useCB     = true;
      function cycleCollectionThumb() {
        var pool = (useCB && cbPool.length) ? cbPool : (pcPool.length ? pcPool : cbPool);
        useCB = !useCB;
        var src = pool[Math.floor(Math.random() * pool.length)];
        var img = new Image();
        img.onload = function() { cyclingBgEl.style.backgroundImage = 'url(' + src + ')'; };
        img.onerror = function() { useCB = !useCB; cycleCollectionThumb(); };
        img.src = src;
      }
      cycleCollectionThumb();
      setInterval(cycleCollectionThumb, 5000);
    }

    // Event listeners on cards
    $$('.collection-card', collectionsTrack).forEach(function(card) {
      card.addEventListener('click', function() {
        var colId = card.dataset.collectionId;
        if (!colId) return;
        var collection = COLLECTIONS.find(function(c) { return c.id === colId; });
        if (!collection || !collection.subLines || collection.subLines.length === 0) return;
        selectCollection(collection);
      });

      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    // Show carousel buttons if collections overflow the 4×2 grid (>8)
    if (COLLECTIONS.length > 8) {
      carouselPrev.removeAttribute('hidden');
      carouselNext.removeAttribute('hidden');
    }

    initCarousel();
  }

  /* ── CAROUSEL ── */
  var CAROUSEL_CARD_VISIBLE = 8; // 4 cols × 2 rows per grid page

  function initCarousel() {
    if (!carouselPrev || !carouselNext) return;

    carouselPrev.addEventListener('click', function() {
      STATE.carouselOffset = Math.max(0, STATE.carouselOffset - 1);
      updateCarouselPosition();
    });

    carouselNext.addEventListener('click', function() {
      var maxOffset = Math.max(0, COLLECTIONS.length - CAROUSEL_CARD_VISIBLE);
      STATE.carouselOffset = Math.min(maxOffset, STATE.carouselOffset + 1);
      updateCarouselPosition();
    });

    updateCarouselPosition();
  }

  function updateCarouselPosition() {
    if (!collectionsTrack) return;
    var cardW = 100 / CAROUSEL_CARD_VISIBLE; // percentage
    var offset = STATE.carouselOffset * cardW;
    collectionsTrack.style.transform = 'translateX(-' + offset + '%)';

    // Update button states
    if (carouselPrev) carouselPrev.style.opacity = STATE.carouselOffset === 0 ? '0.3' : '1';
    if (carouselNext) {
      var atEnd = STATE.carouselOffset >= COLLECTIONS.length - CAROUSEL_CARD_VISIBLE;
      carouselNext.style.opacity = atEnd ? '0.3' : '1';
    }
  }

  /* ══════════════════════════════════════════════════
     RANK 4: SUB-LINE SELECTOR (Chessboards vs Pieces)
  ══════════════════════════════════════════════════ */
  function renderSubLineSelector(collection) {
    if (!rank4Content) return;
    showNavDot('rank-4');

    var cbImg = getChessboardJPGPath('ic', 'pawn', 'l', '1');
    var pcImg = getProductPNGPath('stoic', 'P', 'FFFFFF');

    rank4Content.innerHTML =
      '<div class="subline-grid">' +
        '<div class="subline-card sq-dark" data-subline="chessboards" role="button" tabindex="0" aria-label="Chessboards — Turtlenecks">' +
          '<div class="subline-card-bg" style="background-image:url(' + cbImg + ')"></div>' +
          '<span class="subline-card-label">Chessboards</span>' +
          '<span class="subline-card-sub">Turtlenecks · $99</span>' +
        '</div>' +
        '<div class="subline-card sq-light" data-subline="pieces" role="button" tabindex="0" aria-label="Pieces — Crewnecks">' +
          '<div class="subline-card-bg" style="background-image:url(' + pcImg + ')"></div>' +
          '<span class="subline-card-label">Pieces</span>' +
          '<span class="subline-card-sub">Crewnecks · $69</span>' +
        '</div>' +
      '</div>';

    // Start cycling backgrounds for each subline card
    setTimeout(function() {
      var cbPool = getChessboardPNGPool();
      var pcPool = getPiecePNGPool();
      var cbBg = rank4Content.querySelector('.subline-card[data-subline="chessboards"] .subline-card-bg');
      var pcBg = rank4Content.querySelector('.subline-card[data-subline="pieces"] .subline-card-bg');
      if (cbBg && cbPool.length) startElementCycler(cbBg, cbPool, 5000);
      if (pcBg && pcPool.length) startElementCycler(pcBg, pcPool, 5500);
    }, 100);

    rank4Content.querySelectorAll('.subline-card[data-subline]').forEach(function(card) {
      card.addEventListener('click', function() { selectSubLine(card.dataset.subline); });
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  }

  function selectSubLine(type) {
    STATE.selectedSubLine = type;
    showNavDot('rank-5');
    // Reset palette theming from any previous selection
    clearRankColors(document.getElementById('rank-5'));
    clearRankColors(document.getElementById('rank-6'));
    // Reveal rank-5; re-hide rank-6 until a garment is chosen
    var r5 = document.getElementById('rank-5');
    var r6 = document.getElementById('rank-6');
    if (r5) r5.removeAttribute('hidden');
    if (r6) r6.setAttribute('hidden', '');
    var rank5Label = document.getElementById('rank-5-label');
    if (rank5Label) rank5Label.textContent = type === 'chessboards' ? 'Chessboards' : 'Pieces';
    renderGarmentLines();
    scrollToSection('rank-5', 'smooth');
  }

  /* ══════════════════════════════════════════════════
     RANK 4: GARMENT LINES
  ══════════════════════════════════════════════════ */
  function selectCollection(collection) {
    var isSameCollection = STATE.selectedCollection && STATE.selectedCollection.id === collection.id;
    STATE.selectedCollection = collection;
    STATE.mode = 'shopping';

    var r4 = document.getElementById('rank-4');
    var r5 = document.getElementById('rank-5');
    var r6 = document.getElementById('rank-6');

    if (isSameCollection) {
      // Returning to the same collection after Continue Shopping:
      // ranks 4-6 already have the user's prior selections — just reveal
      // rank-4 and scroll there so they can review / adjust without losing state.
      if (r4) r4.removeAttribute('hidden');
    } else {
      // Different collection (or first visit): full reset of downstream ranks.
      STATE.selectedLine       = null;
      STATE.selectedSubLine    = null;
      STATE.selectedPiece      = null;
      STATE.selectedColorway   = null;
      STATE.selectedSize       = null;
      STATE.selectedCBVariant  = null;
      STATE.selectedCBPiece    = null;
      STATE.selectedCBLocation = null;

      if (r4) r4.removeAttribute('hidden');
      if (r5) r5.setAttribute('hidden', '');
      if (r6) r6.setAttribute('hidden', '');

      resetNavDots();
      renderSubLineSelector(collection);
      var rank4Label = document.getElementById('rank-4-label');
      if (rank4Label) rank4Label.textContent = collection.name;
    }

    scrollToSection('rank-4', 'smooth');
  }

  function renderGarmentLines() {
    if (!rank5Content) return;
    var html = '';

    if (STATE.selectedSubLine === 'chessboards') {
      // Show 4 chessboard variant cards — explicit sq-light/sq-dark so clones stay correct
      html = CHESSBOARD_VARIANTS_LIST.map(function(varId, i) {
        var v = CHESSBOARD_VARIANTS[varId];
        var sqClass = i % 2 === 0 ? 'sq-light' : 'sq-dark';
        return '<div class="product-card ' + sqClass + ' anim-ready" ' +
               'data-variant-id="' + varId + '" ' +
               'role="button" tabindex="0" ' +
               'aria-label="' + sanitize(v.name) + '">' +
               '<div class="product-card-cycling-bg"></div>' +
               '<span class="product-card-name">' + sanitize(v.name) + '</span>' +
               '<div class="product-card-palette">' +
               '<span class="palette-swatch" style="background:' + v.lightColor + '"></span>' +
               '<span class="palette-swatch" style="background:' + v.darkColor + '"></span>' +
               '</div>' +
               '</div>';
      }).join('');

    } else {
      // Pieces — show 5 line cards — explicit sq-light/sq-dark
      html = PIECES_LINE_KEYS.map(function(lineKey, i) {
        var lineData = PIECES_LINE_DATA[lineKey];
        var sqClass = i % 2 === 0 ? 'sq-light' : 'sq-dark';
        return '<div class="product-card ' + sqClass + ' anim-ready" ' +
               'data-line-id="' + lineKey + '" ' +
               'role="button" tabindex="0" ' +
               'aria-label="' + sanitize(lineData.name) + ' line">' +
               '<div class="product-card-cycling-bg"></div>' +
               '<span class="product-card-name">' + sanitize(lineData.name) + '</span>' +
               '</div>';
      }).join('');
    }

    rank5Content.innerHTML = html;
    rank5Content.classList.add('stagger');

    // Start per-card image cycling using PNG pools
    function startCyclerForCard(card) {
      var varId   = card.dataset.variantId;
      var lineKey = card.dataset.lineId;
      var bgEl    = card.querySelector('.product-card-cycling-bg');
      if (!bgEl) return;
      if (varId) {
        var cp = getChessboardPNGPool().filter(function(p) {
          return p.indexOf('chessboards_' + varId + '.') !== -1 ||
                 p.indexOf('chessboards_' + varId + '_knight') !== -1;
        });
        if (cp.length) startElementCycler(bgEl, cp, 5500);
      } else if (lineKey) {
        var lp  = LINE_IMAGE_PREFIX[lineKey] || lineKey;
        var lcp = getPiecePNGPool().filter(function(p) { return p.indexOf('pieces_' + lp + '.') !== -1; });
        if (lcp.length) startElementCycler(bgEl, lcp, 5500);
      }
    }

    rank5Content.querySelectorAll('.product-card').forEach(startCyclerForCard);

    startCardAutoScroll(rank5Content);

    var rank5El = document.getElementById('rank-5');

    var scrollbarThumb = rank5El ? rank5El.querySelector('.rank5-scrollbar-thumb') : null;

    function applyRank5HoverCB(varId) {
      var v = CHESSBOARD_VARIANTS[varId];
      if (!v) return;
      updateRankColors(rank5El, v.lightColor, v.darkColor);
      var scheme = CB_HOVER_COLORS[varId];
      if (scheme) {
        if (scrollbarThumb) scrollbarThumb.style.background = scheme.scrollbar;
        rank5Content.querySelectorAll('.product-card[data-variant-id]').forEach(function(c) {
          var nameEl = c.querySelector('.product-card-name');
          if (nameEl) nameEl.style.color = (scheme.names && scheme.names[c.dataset.variantId]) || '';
        });
      }
    }

    function clearRank5HoverCB() {
      if (STATE.selectedCBVariant) {
        applyRank5HoverCB(STATE.selectedCBVariant);
      } else {
        clearRankColors(rank5El);
        if (scrollbarThumb) scrollbarThumb.style.background = '';
        rank5Content.querySelectorAll('.product-card-name').forEach(function(el) { el.style.color = ''; });
      }
    }

    function applyRank5HoverPC(lineKey) {
      var lineData = PIECES_LINE_DATA[lineKey];
      if (!lineData) return;
      updateRankColors(rank5El, lineData.colors[0], lineData.colors[1]);
      var scheme = PC_HOVER_COLORS[lineKey];
      if (scheme) {
        if (scrollbarThumb) scrollbarThumb.style.background = scheme.scrollbar;
        rank5Content.querySelectorAll('.product-card[data-line-id]').forEach(function(c) {
          var nameEl = c.querySelector('.product-card-name');
          if (nameEl) nameEl.style.color = (scheme.names && scheme.names[c.dataset.lineId]) || '';
        });
      }
    }

    function clearRank5HoverPC() {
      if (STATE.selectedLine) {
        applyRank5HoverPC(STATE.selectedLine.id);
      } else {
        clearRankColors(rank5El);
        if (scrollbarThumb) scrollbarThumb.style.background = '';
        rank5Content.querySelectorAll('.product-card-name').forEach(function(el) { el.style.color = ''; });
      }
    }

    // Chessboard variant selection
    rank5Content.querySelectorAll('.product-card[data-variant-id]').forEach(function(card) {
      card.addEventListener('click', function() {
        var varId = card.dataset.variantId;
        STATE.selectedCBVariant = varId;
        var v = CHESSBOARD_VARIANTS[varId];
        updateRankColors(rank5El, v.lightColor, v.darkColor);
        updateBreadcrumb(bc6, [STATE.selectedCollection.name, 'Chessboards', v.name]);
        renderChessboardCustomization(varId);
        scrollToSection('rank-6', 'smooth');
      });
      card.addEventListener('mouseenter', function() { applyRank5HoverCB(card.dataset.variantId); });
      card.addEventListener('mouseleave', clearRank5HoverCB);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    // Pieces line selection
    rank5Content.querySelectorAll('.product-card[data-line-id]').forEach(function(card) {
      card.addEventListener('click', function() {
        var lineKey = card.dataset.lineId;
        var lineData = PIECES_LINE_DATA[lineKey];
        STATE.selectedLine = lineData;
        updateRankColors(rank5El, lineData.colors[0], lineData.colors[1]);
        updateBreadcrumb(bc6, [STATE.selectedCollection.name, 'Pieces', lineData.name]);
        renderPiecesCustomization(lineData);
        scrollToSection('rank-6', 'smooth');
      });
      card.addEventListener('mouseenter', function() { applyRank5HoverPC(card.dataset.lineId); });
      card.addEventListener('mouseleave', clearRank5HoverPC);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    setTimeout(function() {
      rank5Content.querySelectorAll('.anim-ready').forEach(function(el, i) {
        setTimeout(function() { el.classList.add('visible'); }, i * 60);
      });
    }, 100);
  }

  /* ══════════════════════════════════════════════════
     RANK 6: CHESSBOARD CUSTOMIZATION
  ══════════════════════════════════════════════════ */
  function renderChessboardCustomization(varId) {
    if (!rank6Content) return;
    showNavDot('rank-6');
    var r6 = document.getElementById('rank-6');
    if (r6) r6.removeAttribute('hidden');
    var r6Label = document.getElementById('rank-6-label');
    var v = CHESSBOARD_VARIANTS[varId];
    if (r6Label) r6Label.textContent = v.name;

    if (!STATE.selectedCBPiece)    STATE.selectedCBPiece    = 'pawn';
    if (!STATE.selectedCBLocation) STATE.selectedCBLocation = 'l';

    var r6El = document.getElementById('rank-6');
    updateRankColors(r6El, v.lightColor, v.darkColor);
    applyModColors(r6El, CB_MOD_COLORS[varId] || null);

    // Use direct JPG images on all devices — CLO iframe had rendering issues in
    // deployed environments (wrong camera framing, grey background). JPG + zoom
    // works reliably everywhere. getChessboardViewerPath() preserved for future use.
    function buildHtml() {
      var initShot = STATE.selectedCBLocation === 'sl' ? '3' : STATE.selectedCBLocation === 'sr' ? '2' : '1';
      var jpgSrc = getChessboardJPGPath(varId, STATE.selectedCBPiece, STATE.selectedCBLocation, initShot);
      var previewEl = '<div class="cb-preview-zoom-wrap" id="cb-preview-zoom-wrap">' +
                  '<img class="cb-preview-img" id="cb-preview-img" src="' + jpgSrc + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
                  '</div>' +
                  '<div class="cb-zoom-controls">' +
                  '<button class="cb-zoom-btn cb-zoom-in" aria-label="Zoom in">+</button>' +
                  '<button class="cb-zoom-btn cb-zoom-out" aria-label="Zoom out">\u2212</button>' +
                  '</div>';

      var pieceGrid = CHESSBOARD_PIECES_CB.map(function(p) {
        var sel = STATE.selectedCBPiece === p ? ' selected' : '';
        return '<button class="cb-piece-btn' + sel + '" data-piece="' + p + '">' +
               '<span class="cb-piece-btn-icon">' + CHESSBOARD_PIECE_ICONS_CB[p] + '</span>' +
               '<span>' + CHESSBOARD_PIECE_NAMES_CB[p] + '</span>' +
               '</button>';
      }).join('');

      var locationGrid = CHESSBOARD_LOCATION_KEYS.map(function(loc) {
        var sel = STATE.selectedCBLocation === loc ? ' selected' : '';
        return '<button class="cb-location-btn' + sel + '" data-location="' + loc + '">' +
               CHESSBOARD_LOCATIONS[loc] + '</button>';
      }).join('');

      return '<div class="cb-customization">' +
        '<div class="cb-image-col" id="cb-image-col">' +
          previewEl +
        '</div>' +
        '<div class="cb-controls-col">' +
          '<div class="cb-control-groups-wrap">' +
            '<div class="cb-control-group">' +
              '<p class="cb-control-label">PIECE</p>' +
              '<div class="cb-piece-grid">' + pieceGrid + '</div>' +
            '</div>' +
            '<div class="cb-control-group">' +
              '<p class="cb-control-label">PLACEMENT</p>' +
              '<div class="cb-location-grid">' + locationGrid + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cb-cart-section">' +
            '<div class="size-selector"><p class="size-label">Size</p>' +
            '<div class="size-options">' +
            ['XS','S','M','L','XL','XXL'].map(function(s) {
              return '<button class="size-btn" data-size="' + s + '">' + s + '</button>';
            }).join('') +
            '</div></div>' +
            '<p class="product-card-price">$' + CHESSBOARD_PRICE + '</p>' +
            /* CART_ENABLED: '<button class="btn btn-primary" id="add-to-cart-btn">Add to Cart</button>' + */
            '<button class="btn btn-primary" id="add-to-wishlist-btn">Make My Move</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    rank6Content.innerHTML = buildHtml();
    initPreviewZoom();

    function updatePreview() {
      var img = document.getElementById('cb-preview-img');
      if (img) {
        img.style.visibility = 'visible';
        var shot = STATE.selectedCBLocation === 'sl' ? '3' : STATE.selectedCBLocation === 'sr' ? '2' : '1';
        img.src = getChessboardJPGPath(varId, STATE.selectedCBPiece, STATE.selectedCBLocation, shot);
      }
    }

    var cbPieceBtns   = rank6Content.querySelectorAll('.cb-piece-btn[data-piece]');
    var cbLocationBtns = rank6Content.querySelectorAll('.cb-location-btn');
    var cbSizeBtns    = rank6Content.querySelectorAll('.size-btn');

    cbPieceBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        cbPieceBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedCBPiece = btn.dataset.piece;
        updatePreview();
      });
    });

    cbLocationBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        cbLocationBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedCBLocation = btn.dataset.location;
        updatePreview();
      });
    });

    cbSizeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        cbSizeBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedSize = btn.dataset.size;
      });
    });

    /* CART_ENABLED:
    var addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) addBtn.addEventListener('click', function() { handleAddToCartCB(varId); });
    END CART_ENABLED */
  }

  /* ══════════════════════════════════════════════════
     RANK 6: PIECES CUSTOMIZATION
  ══════════════════════════════════════════════════ */
  function renderPiecesCustomization(lineData) {
    if (!rank6Content) return;
    showNavDot('rank-6');
    var r6 = document.getElementById('rank-6');
    if (r6) r6.removeAttribute('hidden');
    var r6Label = document.getElementById('rank-6-label');
    if (r6Label) r6Label.textContent = lineData.name;

    if (!STATE.selectedPiece) STATE.selectedPiece = 'P';
    // Always validate selectedColorway is valid for this line — reset if stale from a different line
    if (!STATE.selectedColorway || lineData.colorways.indexOf(STATE.selectedColorway) === -1) {
      STATE.selectedColorway = lineData.colorways[0];
    }

    var lightColor = lineData.colors[0];
    var darkColor  = lineData.colors[1];
    var r6ElPc = document.getElementById('rank-6');
    updateRankColors(r6ElPc, lightColor, darkColor);
    applyModColors(r6ElPc, PC_MOD_COLORS[lineData.id] || null);

    var previewSrc = getProductPNGPath(lineData.id, STATE.selectedPiece, STATE.selectedColorway);
    var previewJpg = getProductImagePath(lineData.id, STATE.selectedPiece, STATE.selectedColorway);

    var pieceGrid = ['P','B','N','R','Q','K'].map(function(p) {
      var sel = STATE.selectedPiece === p ? ' selected' : '';
      return '<button class="cb-piece-btn' + sel + '" data-piece="' + p + '">' +
             '<span class="cb-piece-btn-icon">' + PIECE_ICONS[p] + '</span>' +
             '<span>' + PIECE_NAMES[p] + '</span>' +
             '</button>';
    }).join('');

    var swatches = lineData.colorways.map(function(cwId) {
      var cw = COLORWAYS.find(function(c) { return c.id === cwId; });
      if (!cw) return '';
      var sel = STATE.selectedColorway === cwId ? ' selected' : '';
      return '<button class="cb-colorway-swatch' + sel + '" data-cw="' + cwId + '" ' +
             'style="background:' + cw.hex + '" ' +
             'title="' + cw.name + '"></button>';
    }).join('');

    rank6Content.innerHTML =
      '<div class="cb-customization">' +
        '<div class="cb-image-col" id="cb-image-col">' +
          '<div class="cb-preview-zoom-wrap" id="cb-preview-zoom-wrap">' +
            '<img class="cb-preview-img" id="cb-preview-img" src="' + previewSrc + '" data-jpg="' + previewJpg + '" alt="" onerror="if(this.src!==this.dataset.jpg){this.src=this.dataset.jpg}else{this.style.visibility=\'hidden\'}">' +
          '</div>' +
          '<div class="cb-zoom-controls">' +
            '<button class="cb-zoom-btn cb-zoom-in" aria-label="Zoom in">+</button>' +
            '<button class="cb-zoom-btn cb-zoom-out" aria-label="Zoom out">\u2212</button>' +
          '</div>' +
        '</div>' +
        '<div class="cb-controls-col">' +
          '<div class="cb-control-groups-wrap">' +
            '<div class="cb-control-group">' +
              '<p class="cb-control-label">PIECE</p>' +
              '<div class="cb-piece-grid">' + pieceGrid + '</div>' +
            '</div>' +
            '<div class="cb-control-group">' +
              '<p class="cb-control-label">COLORWAY</p>' +
              '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">' + swatches + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cb-cart-section">' +
            '<div class="size-selector"><p class="size-label">Size</p>' +
            '<div class="size-options">' +
            ['XS','S','M','L','XL','XXL'].map(function(s) {
              return '<button class="size-btn" data-size="' + s + '">' + s + '</button>';
            }).join('') +
            '</div></div>' +
            '<p class="product-card-price">$' + PIECES_PRICE + '</p>' +
            /* CART_ENABLED: '<button class="btn btn-primary" id="add-to-cart-btn">Add to Cart</button>' + */
            '<button class="btn btn-primary" id="add-to-wishlist-btn">Make My Move</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    initPreviewZoom();

    function updatePreview() {
      var img = document.getElementById('cb-preview-img');
      if (img) {
        img.style.visibility = 'visible';
        var pngSrc = getProductPNGPath(lineData.id, STATE.selectedPiece, STATE.selectedColorway);
        var jpgSrc = getProductImagePath(lineData.id, STATE.selectedPiece, STATE.selectedColorway);
        img.dataset.jpg = jpgSrc;
        img.onerror = function() { img.src = jpgSrc; img.onerror = null; };
        img.src = pngSrc;
      }
    }

    var pcPieceBtns  = rank6Content.querySelectorAll('.cb-piece-btn[data-piece]');
    var pcSwatches   = rank6Content.querySelectorAll('.cb-colorway-swatch[data-cw]');
    var pcSizeBtns   = rank6Content.querySelectorAll('.size-btn');

    pcPieceBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        pcPieceBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedPiece = btn.dataset.piece;
        updatePreview();
      });
    });

    pcSwatches.forEach(function(btn) {
      btn.addEventListener('click', function() {
        pcSwatches.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedColorway = btn.dataset.cw;
        updatePreview();
      });
    });

    pcSizeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        pcSizeBtns.forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        STATE.selectedSize = btn.dataset.size;
      });
    });

    /* CART_ENABLED:
    var addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) addBtn.addEventListener('click', function() { handleAddToCartPieces(lineData); });
    END CART_ENABLED */
  }

  /* ══════════════════════════════════════════════════
     CART MANAGEMENT
  ══════════════════════════════════════════════════ */
  // Returns a stable key used to identify duplicate cart items.
  // Chessboards include location (images differ per placement).
  function cartItemKey(item) {
    if (item.type === 'chessboard') {
      return 'cb|' + item.variant + '|' + item.piece + '|' + item.location + '|' + item.size;
    }
    var cwId = item.colorway && item.colorway.id ? item.colorway.id : (item.colorway || '');
    return 'pc|' + item.line + '|' + item.piece + '|' + cwId + '|' + item.size;
  }

  function handleAddToCartCB(varId) {
    if (!STATE.selectedSize)       { alert('Please select a size.');      return; }
    if (!STATE.selectedCBPiece)    { alert('Please select a piece.');     return; }
    if (!STATE.selectedCBLocation) { alert('Please select a placement.'); return; }

    var v = CHESSBOARD_VARIANTS[varId];
    var newItem = {
      id:           'cb_' + varId + '_' + STATE.selectedCBPiece + '_' + STATE.selectedCBLocation + '_' + STATE.selectedSize,
      type:         'chessboard',
      collection:   STATE.selectedCollection ? STATE.selectedCollection.name : 'First Move',
      variant:      varId,
      variantName:  v.name,
      piece:        STATE.selectedCBPiece,
      pieceName:    CHESSBOARD_PIECE_NAMES_CB[STATE.selectedCBPiece],
      location:     STATE.selectedCBLocation,
      locationName: CHESSBOARD_LOCATIONS[STATE.selectedCBLocation],
      size:         STATE.selectedSize,
      price:        CHESSBOARD_PRICE,
      image:        getChessboardJPGPath(varId, STATE.selectedCBPiece, STATE.selectedCBLocation, '1'),
      qty:          1
    };
    var key = cartItemKey(newItem);
    var existing = STATE.cart.find(function(i) { return cartItemKey(i) === key; });
    if (existing) { existing.qty += 1; } else { STATE.cart.push(newItem); }
    updateCartUI();
    saveCart();
    flashAddToCart();
  }

  function handleAddToCartPieces(lineData) {
    if (!STATE.selectedSize)     { alert('Please select a size.');     return; }
    if (!STATE.selectedPiece)    { alert('Please select a piece.');    return; }
    if (!STATE.selectedColorway) { alert('Please select a colorway.'); return; }

    var cwId = STATE.selectedColorway;
    var cw   = COLORWAYS.find(function(c) { return c.id === cwId; }) || { id: cwId, name: cwId, hex: '#' + cwId };
    var newItem = {
      id:       'pc_' + lineData.id + '_' + STATE.selectedPiece + '_' + cwId + '_' + STATE.selectedSize,
      type:     'pieces',
      collection: STATE.selectedCollection ? STATE.selectedCollection.name : 'First Move',
      line:     lineData.id,
      lineName: lineData.name,
      piece:    STATE.selectedPiece,
      pieceName: PIECE_NAMES[STATE.selectedPiece] || STATE.selectedPiece,
      colorway:  cw,
      size:     STATE.selectedSize,
      price:    PIECES_PRICE,
      image:         getProductPNGPath(lineData.id, STATE.selectedPiece, cwId),
      imageFallback: getProductImagePath(lineData.id, STATE.selectedPiece, cwId),
      qty:      1
    };
    var key = cartItemKey(newItem);
    var existing = STATE.cart.find(function(i) { return cartItemKey(i) === key; });
    if (existing) { existing.qty += 1; } else { STATE.cart.push(newItem); }
    updateCartUI();
    saveCart();
    flashAddToCart();
  }

  function flashAddToCart() {
    var btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = 'Added ♛';
    btn.classList.add('btn-confirmed');
    setTimeout(function() {
      btn.textContent = orig;
      btn.classList.remove('btn-confirmed');
    }, 2000);
  }

  function flashAddToWishlist() {
    var btn = document.getElementById('add-to-wishlist-btn');
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = 'Saved ♛';
    btn.classList.add('btn-confirmed');
    setTimeout(function() {
      btn.textContent = orig;
      btn.classList.remove('btn-confirmed');
    }, 2000);
  }

  function removeFromCart(itemId) {
    STATE.cart = STATE.cart.filter(function(i) { return i.id !== itemId; });
    updateCartUI();
    saveCart();
  }

  function updateCartUI() {
    var count = STATE.cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
    if (cartCountEl) cartCountEl.textContent = count;

    var subtotal = STATE.cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);

    if (cartItemsEl) {
      if (STATE.cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart-empty">Your board is clear. <a href="#rank-3">Start your opening.</a></p>';
      } else {
        cartItemsEl.innerHTML = STATE.cart.map(function(item) {
          var itemName, itemDetails;
          if (item.type === 'chessboard') {
            itemName    = sanitize((item.variantName || item.variant) + ' · ' + (item.pieceName || item.piece));
            itemDetails = sanitize((item.locationName || item.location) + ' · Size ' + item.size);
          } else {
            itemName    = sanitize((item.lineName || item.line || '') + ' ' + (item.pieceName || item.piece));
            itemDetails = sanitize((item.colorway && item.colorway.name ? item.colorway.name : '') + ' · Size ' + item.size);
          }
          var priceHtml = item.qty > 1
            ? '<span class="cart-item-qty">×' + item.qty + '</span> ' + formatDollar(item.price * item.qty)
            : formatDollar(item.price);
          return '<div class="cart-item">' +
                 '<img class="cart-item-img" src="' + item.image + '" alt="' + sanitize(item.pieceName || '') + '" onerror="this.style.display=\'none\'">' +
                 '<div class="cart-item-info">' +
                 '<span class="cart-item-name">' + itemName + '</span>' +
                 '<span class="cart-item-details">' + itemDetails + '</span>' +
                 '<span class="cart-item-price">' + priceHtml + '</span>' +
                 '<button class="cart-item-remove" data-item-id="' + sanitize(item.id) + '" aria-label="Remove item">Remove</button>' +
                 '</div>' +
                 '</div>';
        }).join('');

        // Remove buttons
        $$('.cart-item-remove', cartItemsEl).forEach(function(btn) {
          btn.addEventListener('click', function() {
            removeFromCart(btn.dataset.itemId);
          });
        });
      }
    }

    if (cartSubtotal) cartSubtotal.textContent = formatDollar(subtotal);
    if (cartFooter) cartFooter.hidden = STATE.cart.length === 0;
  }

  function updateWishlistUI() {
    var wishlistEl = document.getElementById('wishlist-items');
    if (!wishlistEl) return;

    if (STATE.wishlist.length === 0) {
      wishlistEl.innerHTML = '<p class="wishlist-empty">Save pieces for later</p>';
    } else {
      wishlistEl.innerHTML = STATE.wishlist.map(function(item) {
        return '<div style="font-size:0.72rem; opacity:0.8; display:flex; justify-content:space-between;">' +
               '<span>' + sanitize(item.line + ' ' + item.piece) + '</span>' +
               '<span>' + formatDollar(item.price) + '</span>' +
               '</div>';
      }).join('');
    }
  }

  /* ══════════════════════════════════════════════════
     RANK 7: DYNAMIC MODE SWITCH
  ══════════════════════════════════════════════════ */
  function showContactRank7() {
    if (rank7Contact)  rank7Contact.removeAttribute('hidden');
    if (rank7Checkout) rank7Checkout.setAttribute('hidden', '');
  }

  function showCheckoutRank7() {
    if (rank7Contact)  rank7Contact.setAttribute('hidden', '');
    if (rank7Checkout) rank7Checkout.removeAttribute('hidden');
    populateCheckoutSummary();
  }

  function populateCheckoutSummary() {
    var productDisplayEl = document.getElementById('checkout-product-display');
    var detailsEl        = document.getElementById('checkout-order-details');
    var breakdownEl      = document.getElementById('checkout-total-breakdown');

    var subtotal = STATE.cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
    var discount = STATE.appliedPromo
      ? Math.round(subtotal * STATE.appliedPromo.discountPct) / 100
      : 0;
    var total = subtotal - discount;

    // ── Square b: cycling product image ──
    stopCheckoutImageCycler();
    if (productDisplayEl) {
      if (STATE.cart.length === 0) {
        productDisplayEl.innerHTML = '<p class="checkout-product-empty">Your cart is empty.</p>';
      } else {
        var dotsHtml = STATE.cart.length > 1
          ? '<div class="checkout-img-dots" id="checkout-img-dots">' +
              STATE.cart.map(function(_, i) {
                return '<span class="checkout-img-dot' + (i === 0 ? ' active' : '') + '"></span>';
              }).join('') +
            '</div>'
          : '';
        productDisplayEl.innerHTML =
          '<img class="checkout-product-img" id="checkout-cycling-img" src="" alt="" onerror="if(this.src!==this.dataset.fallback&&this.dataset.fallback){this.src=this.dataset.fallback}else{this.style.display=\'none\'}">' +
          '<div class="checkout-product-meta">' +
            dotsHtml +
            '<span class="checkout-product-name" id="checkout-cycling-name"></span>' +
            '<span class="checkout-product-size" id="checkout-cycling-size"></span>' +
          '</div>';
        updateCheckoutProductSlide(0);
        if (STATE.cart.length > 1) initCheckoutImageCycler();
      }
    }

    // ── Square f: item list with qty + line subtotals ──
    if (detailsEl) {
      detailsEl.innerHTML = STATE.cart.map(function(item) {
        var desc;
        if (item.type === 'chessboard') {
          desc = (item.variantName || item.variant) + ' ' + (item.pieceName || item.piece) +
                 ' (' + (item.locationName || item.location) + ', ' + item.size + ')';
        } else {
          desc = (item.lineName || item.line || '') + ' ' + (item.pieceName || item.piece) +
                 ' (' + (item.colorway && item.colorway.name ? item.colorway.name : '') + ', ' + item.size + ')';
        }
        var qtyTag = item.qty > 1 ? ' <span class="checkout-item-qty">×' + item.qty + '</span>' : '';
        return '<div class="checkout-cart-item">' +
               '<span>' + sanitize(desc) + qtyTag + '</span>' +
               '<span>' + formatDollar(item.price * item.qty) + '</span>' +
               '</div>';
      }).join('');
    }

    // ── Square f: total breakdown ──
    if (breakdownEl) {
      var html = '';
      if (discount > 0) {
        html += '<div class="checkout-breakdown-row">' +
                  '<span>Subtotal</span>' +
                  '<span>' + formatDollar(subtotal) + '</span>' +
                '</div>' +
                '<div class="checkout-breakdown-row checkout-discount-row">' +
                  '<span>Discount (' + STATE.appliedPromo.discountPct + '% · ' + sanitize(STATE.appliedPromo.code) + ')</span>' +
                  '<span>−' + formatDollar(discount) + '</span>' +
                '</div>';
      }
      html += '<div class="checkout-breakdown-row checkout-breakdown-total">' +
                '<span>Total</span>' +
                '<strong>' + formatDollar(total) + '</strong>' +
              '</div>';
      breakdownEl.innerHTML = html;
    }

    updateWishlistUI();
  }

  /* ══════════════════════════════════════════════════
     CHECKOUT IMAGE CYCLER
  ══════════════════════════════════════════════════ */
  var _checkoutCyclerTimer = null;
  var _checkoutCyclerIdx   = 0;

  function updateCheckoutProductSlide(idx) {
    var item   = STATE.cart[idx];
    if (!item) return;
    var imgEl  = document.getElementById('checkout-cycling-img');
    var nameEl = document.getElementById('checkout-cycling-name');
    var sizeEl = document.getElementById('checkout-cycling-size');

    if (imgEl) {
      imgEl.dataset.fallback = item.imageFallback || '';
      imgEl.style.display = '';
      imgEl.src = item.image || '';
    }

    var desc;
    if (item.type === 'chessboard') {
      desc = sanitize(item.variantName || item.variant) + '<br>' +
             sanitize((item.pieceName || item.piece) + ' · ' + (item.locationName || item.location));
    } else {
      desc = sanitize(item.lineName || item.line || '') + '<br>' +
             sanitize((item.pieceName || item.piece) + ' · ' + (item.colorway && item.colorway.name ? item.colorway.name : ''));
    }
    var qtyBadge = item.qty > 1 ? ' <span class="checkout-product-qty">×' + item.qty + '</span>' : '';
    if (nameEl) nameEl.innerHTML = desc + qtyBadge;
    if (sizeEl) sizeEl.textContent = 'Size: ' + (item.size || '');

    // Update dots
    $$('.checkout-img-dot').forEach(function(dot, i) {
      dot.classList.toggle('active', i === idx);
    });
  }

  function initCheckoutImageCycler() {
    _checkoutCyclerIdx = 0;
    _checkoutCyclerTimer = setInterval(function() {
      var imgEl = document.getElementById('checkout-cycling-img');
      if (!imgEl || STATE.cart.length < 2) { stopCheckoutImageCycler(); return; }
      imgEl.style.opacity = '0';
      setTimeout(function() {
        _checkoutCyclerIdx = (_checkoutCyclerIdx + 1) % STATE.cart.length;
        updateCheckoutProductSlide(_checkoutCyclerIdx);
        imgEl.style.opacity = '';
      }, 350);
    }, 4000);
  }

  function stopCheckoutImageCycler() {
    if (_checkoutCyclerTimer) { clearInterval(_checkoutCyclerTimer); _checkoutCyclerTimer = null; }
    _checkoutCyclerIdx = 0;
  }

  /* ══════════════════════════════════════════════════
     BREADCRUMB HELPER
  ══════════════════════════════════════════════════ */
  function updateBreadcrumb(el, crumbs) {
    if (!el) return;
    el.innerHTML = crumbs.map(function(c, i) {
      return '<span class="breadcrumb-item' + (i === crumbs.length - 1 ? ' active' : '') + '">' + sanitize(c) + '</span>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════
     CONTACT FORM
  ══════════════════════════════════════════════════ */
  function initContactForm() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var nameEl    = document.getElementById('contact-name');
      var emailEl   = document.getElementById('contact-email');
      var messageEl = document.getElementById('contact-message');

      if (!nameEl || !emailEl || !messageEl) return;

      // Validate — highlight empty fields
      var valid = true;
      [nameEl, emailEl, messageEl].forEach(function(inp) {
        if (!inp.value.trim()) {
          inp.style.borderColor = '#c0392b';
          setTimeout(function() { inp.style.borderColor = ''; }, 3000);
          valid = false;
        }
      });
      if (!valid) return;

      var submitBtn = contactForm.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending\u2026'; }

      // If no endpoint is configured yet, skip the fetch and go straight to confirm
      if (!CONTACT_ENDPOINT) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        showRank8ContactConfirm();
        return;
      }

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action:  'contact',
          token:   SECRET_TOKEN,
          name:    nameEl.value.trim(),
          email:   emailEl.value.trim(),
          message: messageEl.value.trim()
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        if (data.ok) {
          showRank8ContactConfirm();
        } else {
          // Surface the error inline without blocking the user
          var errMsg = data.error || 'Something went wrong. Please try again.';
          nameEl.style.borderColor = '';
          emailEl.style.borderColor = '';
          messageEl.style.borderColor = '#c0392b';
          messageEl.title = errMsg;
          setTimeout(function() { messageEl.style.borderColor = ''; messageEl.title = ''; }, 4000);
        }
      })
      .catch(function() {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        // Network failure — still advance to confirm so user isn't stuck
        showRank8ContactConfirm();
      });
    });
  }

  function showRank8ContactConfirm() {
    if (rank8Page)           rank8Page.removeAttribute('hidden');
    if (rank8ContactConfirm) rank8ContactConfirm.removeAttribute('hidden');
    if (rank8OrderConfirm)   rank8OrderConfirm.setAttribute('hidden', '');

    scrollToSection('rank-8', 'smooth');
  }

  /* ══════════════════════════════════════════════════
     ORDER PLACEMENT
  ══════════════════════════════════════════════════ */
  function initCheckoutActions() {
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', function() {
        placeOrder();
      });
    }

    if (continueShopBtn) {
      continueShopBtn.addEventListener('click', function() {
        STATE.appliedPromo = null;
        // Smooth scroll back to Collections; only swap rank-7 to contact AFTER
        // we've arrived so rank-7 checkout stays visible during the upward scroll
        // and the user never sees a content flash mid-animation.
        scrollToSection('rank-3', 'smooth', function() {
          showContactRank7();
        });
      });
    }

    var checkoutBtnMain = document.getElementById('checkout-btn');
    if (checkoutBtnMain) {
      checkoutBtnMain.addEventListener('click', function() {
        closeCart();
        showCheckoutRank7();
        scrollToSection('rank-7', 'smooth');
      });
    }
  }

  function placeOrder() {
    if (STATE.cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    // Validate required fields
    var nameEl  = document.getElementById('ship-name');
    var addrEl  = document.getElementById('ship-address');
    var emailEl = document.getElementById('checkout-email');

    if (nameEl  && !nameEl.value.trim())  { nameEl.focus();  return; }
    if (addrEl  && !addrEl.value.trim())  { addrEl.focus();  return; }
    if (emailEl && !emailEl.value.trim()) { emailEl.focus(); return; }

    // Compute final total (with any applied discount)
    var subtotal = STATE.cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
    var discount = STATE.appliedPromo
      ? Math.round(subtotal * STATE.appliedPromo.discountPct) / 100
      : 0;
    var grandTotal = subtotal - discount;

    // Newsletter / First Mover signup if checkbox checked
    var newsletterEl = document.getElementById('checkout-newsletter');
    var customerEmail = emailEl ? emailEl.value.trim() : '';
    var customerName  = nameEl  ? nameEl.value.trim()  : '';
    if (newsletterEl && newsletterEl.checked && customerEmail) {
      // Fire-and-forget — does not block order completion
      fetch(WISHLIST_ENDPOINT, {
        method: 'POST',
        body:   JSON.stringify({ action: 'newsletter', token: SECRET_TOKEN, email: customerEmail, name: customerName })
      }).catch(function() {});
    }

    // Show order confirmation
    var orderNum  = 'ORD-7R-' + Math.floor(Math.random() * 90000 + 10000);
    var detailsEl = document.getElementById('order-confirm-details');
    if (detailsEl) {
      detailsEl.innerHTML =
        '<p style="font-size:0.8rem; opacity:0.7;">Order <strong>' + orderNum + '</strong></p>' +
        '<p style="font-size:0.8rem; opacity:0.7;">Total charged: <strong>' + formatDollar(grandTotal) + '</strong></p>';
    }

    if (rank8Page)           rank8Page.removeAttribute('hidden');
    if (rank8ContactConfirm) rank8ContactConfirm.setAttribute('hidden', '');
    if (rank8OrderConfirm)   rank8OrderConfirm.removeAttribute('hidden');

    // Reset cart + promo state
    STATE.cart          = [];
    STATE.appliedPromo  = null;
    updateCartUI();
    saveCart();

    scrollToSection('rank-8', 'smooth');
    exitShoppingMode();
  }

  function exitShoppingMode() {
    STATE.mode               = 'default';
    STATE.selectedCollection = null;
    STATE.selectedLine       = null;
    STATE.selectedPiece      = null;
    STATE.selectedColorway   = null;
    STATE.selectedSize       = null;
    STATE.selectedSubLine    = null;
    STATE.selectedCBVariant  = null;
    STATE.selectedCBPiece    = null;
    STATE.selectedCBLocation = null;
    STATE.appliedPromo       = null;

    // Hide middle ranks
    ['rank-4','rank-5','rank-6'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('hidden', '');
    });
    resetNavDots();

    showContactRank7();
  }

  // Used by the "Continue Shopping" CTA in checkout.
  // Unlike exitShoppingMode, this preserves the user's selections and keeps
  // ranks 4-6 visible so they can scroll through prior choices or adjust them.
  // Clicking the same collection at rank-3 resumes from rank-4 (pre-filled);
  // clicking a different collection triggers a full reset via selectCollection.
  function returnToCollections() {
    STATE.appliedPromo = null;  // promo shouldn't carry over to a future checkout
    showContactRank7();         // switch rank-7 from checkout → contact (off-screen)
    // ranks 4-6 remain visible and pre-filled; STATE selections are preserved
  }

  /* ══════════════════════════════════════════════════
     CART DRAWER TOGGLE
  ══════════════════════════════════════════════════ */
  function openCart() {
    if (cartDrawer)   cartDrawer.classList.add('open');
    if (cartBackdrop) cartBackdrop.classList.add('active');
    if (cartDrawer)   cartDrawer.removeAttribute('aria-hidden');
  }

  function closeCart() {
    if (cartDrawer)   cartDrawer.classList.remove('open');
    if (cartBackdrop) cartBackdrop.classList.remove('active');
    if (cartDrawer)   cartDrawer.setAttribute('aria-hidden', 'true');
  }

  var CART_STORAGE_KEY = '7thrank_cart_v1';

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(STATE.cart));
    } catch(e) {}
  }

  function restoreCart() {
    try {
      var raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          STATE.cart = parsed;
          updateCartUI();
        }
      }
    } catch(e) {}
  }

  function initCart() {
    if (cartTrigger) cartTrigger.addEventListener('click', openCart);
    if (cartClose)   cartClose.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    // "Start your opening" in empty cart — use JS scroll for iOS compatibility
    var startOpeningBtn = document.getElementById('cart-start-opening');
    if (startOpeningBtn) {
      startOpeningBtn.addEventListener('click', function() {
        closeCart();
        scrollToSection('rank-3', 'smooth');
      });
    }

    // Checkout from cart goes to rank 7 checkout mode
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        closeCart();
        showCheckoutRank7();
        scrollToSection('rank-7', 'smooth');
      });
    }
  }

  /* ══════════════════════════════════════════════════
     MOBILE MENU
  ══════════════════════════════════════════════════ */
  function initMobileMenu() {
    if (!menuToggle || !mobileOverlay) return;

    function closeMobileMenu() {
      mobileOverlay.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', function() {
      var isOpen = mobileOverlay.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close (×) button inside the overlay
    var mobileCloseBtn = document.getElementById('mobile-close');
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileMenu);

    // Cart button in mobile nav
    var mobileCartBtn = document.getElementById('mobile-cart-btn');
    if (mobileCartBtn) {
      mobileCartBtn.addEventListener('click', function() {
        closeMobileMenu();
        openCart();
      });
    }

    // My Wishlist button in mobile nav
    var mobileWishlistBtn = document.getElementById('mobile-wishlist-btn');
    if (mobileWishlistBtn) {
      mobileWishlistBtn.addEventListener('click', function() {
        closeMobileMenu();
        openLoginModal();
      });
    }

    // All nav links close the menu on click
    $$('.mobile-nav-link', mobileOverlay).forEach(function(link) {
      link.addEventListener('click', function() { closeMobileMenu(); });
    });
  }

  /* ══════════════════════════════════════════════════
     NAV DOTS
  ══════════════════════════════════════════════════ */
  function initNavDots() {
    navDots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        var target = dot.dataset.rank;
        if (!target) return;

        // Clicking on rank 4/5/6 dots in default mode → enter shopping mode
        if (['rank-4','rank-5','rank-6'].indexOf(target) !== -1 && STATE.mode === 'default') {
          return; // ignore in default mode
        }

        scrollToSection(target, 'smooth');
      });

      dot.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dot.click(); }
      });
    });
  }

  /* ══════════════════════════════════════════════════
     HEADER NAV LINKS
  ══════════════════════════════════════════════════ */
  function initHeaderNav() {
    $$('.nav-link[data-target]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var target = link.dataset.target;
        if (target === 'rank-7') {
          showContactRank7();
        }
        scrollToSection(target, 'smooth');
      });
    });

    $$('a[href^="#rank-"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = a.getAttribute('href').replace('#', '');
        scrollToSection(targetId, 'smooth');
      });
    });

    $$('a[href="#landing"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToSection('landing', 'smooth');
      });
    });
  }

  /* ══════════════════════════════════════════════════
     KEYBOARD NAVIGATION
  ══════════════════════════════════════════════════ */
  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      if (document.activeElement && ['INPUT','TEXTAREA','SELECT'].indexOf(document.activeElement.tagName) !== -1) return;
      if (e.key === 'Escape') {
        closeCart();
        if (mobileOverlay.classList.contains('open')) {
          mobileOverlay.classList.remove('open');
          menuToggle.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════
     HEADER SCROLL DETECTION
  ══════════════════════════════════════════════════ */
  function initHeaderScroll() {
    board.addEventListener('scroll', function() {
      if (board.scrollTop > 80) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     CONFIRM BACK BUTTONS
  ══════════════════════════════════════════════════ */
  function initConfirmButtons() {
    var confirmBackBtn = document.getElementById('confirm-back-btn');
    var orderBackBtn   = document.getElementById('order-back-btn');

    if (confirmBackBtn) {
      confirmBackBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (rank8Page) rank8Page.setAttribute('hidden', '');
        scrollToSection('rank-3', 'smooth');
      });
    }

    if (orderBackBtn) {
      orderBackBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (rank8Page) rank8Page.setAttribute('hidden', '');
        scrollToSection('landing', 'smooth');
      });
    }
  }

  /* ══════════════════════════════════════════════════
     PROMO CODE
  ══════════════════════════════════════════════════ */
  function initPromoCode() {
    var promoBtn   = document.getElementById('promo-apply-btn');
    var promoInput = document.getElementById('promo-input');
    if (!promoBtn || !promoInput) return;

    promoBtn.addEventListener('click', function() {
      var code = promoInput.value.trim().toUpperCase();
      if (!code) return;

      promoBtn.disabled     = true;
      promoBtn.textContent  = '…';
      promoInput.style.borderColor = '';

      fetch(WISHLIST_ENDPOINT, {
        method: 'POST',
        body:   JSON.stringify({ action: 'validateCode', token: SECRET_TOKEN, code: code })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        promoBtn.disabled = false;
        if (data.ok && data.valid) {
          STATE.appliedPromo   = { code: code, discountPct: 15 };
          promoInput.disabled  = true;
          promoBtn.textContent = 'Applied ✓';
          promoBtn.style.color = '#2d9c5a';
          populateCheckoutSummary();
        } else {
          promoInput.style.borderColor = '#c0392b';
          promoBtn.textContent = 'Apply';
          setTimeout(function() { promoInput.style.borderColor = ''; }, 2500);
        }
      })
      .catch(function() {
        promoBtn.disabled    = false;
        promoBtn.textContent = 'Apply';
        promoInput.style.borderColor = '#c0392b';
        setTimeout(function() { promoInput.style.borderColor = ''; }, 2500);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     FOOTER YEAR
  ══════════════════════════════════════════════════ */
  function setFooterYear() {
    if (footerYear) footerYear.textContent = new Date().getFullYear();
  }

  /* ══════════════════════════════════════════════════
     GSAP ENHANCEMENTS (if GSAP is available)
  ══════════════════════════════════════════════════ */
  function initGSAP() {
    if (typeof gsap === 'undefined') return;

    // Staggered entrance for rank 1 letters
    gsap.from('.rank-1 .sq-letter', {
      opacity:  0,
      y:        30,
      stagger:  0.06,
      duration: 0.8,
      ease:     'power3.out',
      delay:    0.3
    });

    // Rank 2 piece entrance
    gsap.from('.rank-2 .sq-piece', {
      opacity:  0,
      scale:    0.7,
      stagger:  0.08,
      duration: 0.6,
      ease:     'back.out(1.7)',
      delay:    0.6
    });

    // Logo entrance
    gsap.from('.sq-logo-img', {
      opacity:  0,
      scale:    0.85,
      duration: 1,
      ease:     'power2.out',
      delay:    0.5
    });

    // Tagline
    gsap.from('.sq-tagline', {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1.0
    });

    // Scroll cue pulse
    gsap.from('.scroll-cue', {
      opacity: 0,
      y: 10,
      duration: 0.6,
      ease: 'power2.out',
      delay: 1.4
    });
  }

  /* ══════════════════════════════════════════════════
     TOUCH / SWIPE NAVIGATION
  ══════════════════════════════════════════════════ */
  function initTouch() {
    var touchStartY = 0;
    var touchStartTime = 0;

    board.addEventListener('touchstart', function(e) {
      touchStartY    = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    board.addEventListener('touchend', function(e) {
      var touchEndY   = e.changedTouches[0].clientY;
      var deltaY      = touchStartY - touchEndY;
      var deltaTime   = Date.now() - touchStartTime;

      // Quick swipe (< 300ms, > 50px)
      if (deltaTime < 300 && Math.abs(deltaY) > 50) {
        var direction = deltaY > 0 ? 'down' : 'up';

        if (STATE.mode !== 'default') {
          // Shopping mode: upward swipe back-navigates through the section stack.
          // For rank-6 (inner scroll), only trigger when the inner container is
          // already scrolled to the top so in-content scrolling isn't interrupted.
          if (direction === 'up') {
            var backMap = { 'rank-6': 'rank-5', 'rank-5': 'rank-4' };
            var backTarget = backMap[STATE.currentSection];
            if (backTarget) {
              var innerEl = document.querySelector('.cb-customization, .pieces-customization');
              var innerAtTop = !innerEl || innerEl.scrollTop <= 0;
              if (innerAtTop) scrollToSection(backTarget, 'smooth');
            }
          } else if (direction === 'down' && STATE.currentSection === 'rank-6') {
            var innerEl = document.querySelector('.cb-customization, .pieces-customization');
            var atBottom = !innerEl || (innerEl.scrollTop + innerEl.clientHeight >= innerEl.scrollHeight - 20);
            if (atBottom) scrollToSection('rank-7', 'smooth');
          }
          return;
        }

        if (STATE.currentSection === 'rank-3' && direction === 'down') {
          bypassMiddleRanks('down');
        } else if (STATE.currentSection === 'rank-7' && direction === 'up') {
          // Only bypass when at the very top of rank-7 — if the user is scrolled
          // down within the contact form, let native scroll handle it first.
          var rank7El = document.getElementById('rank-7');
          if (rank7El) {
            var r7margin = parseInt(getComputedStyle(rank7El).scrollMarginTop, 10) || 0;
            var rank7Top = rank7El.offsetTop - r7margin;
            if (Math.abs(board.scrollTop - rank7Top) < 80) {
              bypassMiddleRanks('up');
            }
          }
        }
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     LEGAL MODALS
  ══════════════════════════════════════════════════ */
  function openLegalModal(id) {
    var el = document.getElementById(id + '-overlay');
    if (!el) return;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLegalModal(id) {
    var el = document.getElementById(id + '-overlay');
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initLegalModals() {
    // Footer trigger links
    var openPrivacy = document.getElementById('open-privacy');
    var openTerms   = document.getElementById('open-terms');
    if (openPrivacy) openPrivacy.addEventListener('click', function(e) { e.preventDefault(); openLegalModal('privacy'); });
    if (openTerms)   openTerms.addEventListener('click',   function(e) { e.preventDefault(); openLegalModal('terms'); });

    // Delegated: inline [data-open] links (wishlist fine print, cookie banner, etc.)
    //            [data-close] close buttons, overlay backdrop clicks
    document.addEventListener('click', function(e) {
      var opener = e.target.closest('[data-open]');
      if (opener) { e.preventDefault(); openLegalModal(opener.dataset.open); return; }

      var closer = e.target.closest('[data-close]');
      if (closer) { e.preventDefault(); closeLegalModal(closer.dataset.close); return; }

      // Clicking the overlay backdrop itself
      if (e.target.classList.contains('legal-overlay')) {
        closeLegalModal(e.target.id.replace('-overlay', ''));
      }
    });

    // Esc key to close any open legal modal
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      ['privacy', 'terms'].forEach(function(id) {
        var el = document.getElementById(id + '-overlay');
        if (el && el.classList.contains('is-open')) closeLegalModal(id);
      });
    });
  }

  /* ══════════════════════════════════════════════════
     COOKIE CONSENT
  ══════════════════════════════════════════════════ */
  function initCookieConsent() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;

    // Show banner only if consent has not been recorded yet
    if (!localStorage.getItem('7r_cookie_consent')) {
      banner.removeAttribute('hidden');
    }

    var acceptBtn  = document.getElementById('cookie-accept');
    var declineBtn = document.getElementById('cookie-decline');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function() {
        localStorage.setItem('7r_cookie_consent', 'accepted');
        banner.setAttribute('hidden', '');
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function() {
        localStorage.setItem('7r_cookie_consent', 'declined');
        banner.setAttribute('hidden', '');
      });
    }
  }

  /* ══════════════════════════════════════════════════
     INITIALIZATION
  ══════════════════════════════════════════════════ */
  function init() {
    setFooterYear();

    // Initial state: hide ranks 4-8 (only show landing + rank-3 initially)
    ['rank-4','rank-5','rank-6','rank-8'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('hidden', '');
    });

    // Show contact on rank-7 by default
    showContactRank7();

    // Render initial collections
    renderCollections();

    // Initialize all subsystems
    initRank2();
    initCart();
    initMobileMenu();
    initNavDots();
    resetNavDots(); // ensure rank-4/5/6 dots are hidden on every fresh load
    restoreCart();  // reload persisted cart items from localStorage
    initHeaderNav();
    initObservers();
    initHeaderScroll();
    initContactForm();
    initCheckoutActions();
    initConfirmButtons();
    initPromoCode();
    initKeyboard();
    initTouch();
    initMobileSnapToggle();
    initLandingImageCycler();
    initWishlist();
    initLoginModal();
    initContactLogoWatermark();
    initLegalModals();
    initCookieConsent();

    // Wheel interception for bypass logic
    board.addEventListener('wheel', handleWheel, { passive: false });

    // GSAP animations (progressive enhancement)
    // GSAP is loaded with defer, so wait a tick
    setTimeout(initGSAP, 100);

    // Mark body as loaded for CSS transitions
    document.body.classList.add('loaded');
  }

  /* ══════════════════════════════════════════════════
     WISHLIST / FIRST MOVER EMAIL FLOW
  ══════════════════════════════════════════════════ */

  // !! Replace with your deployed Apps Script URL after publishing !!
  var WISHLIST_ENDPOINT = 'https://script.google.com/macros/s/AKfycbynjkrlxhyLIu_jAaEkpZ25gFmNBpKzQ2egn_1B-eqsARPAyjt266tl8unjdc3OFpdj/exec';
  var CONTACT_ENDPOINT  = 'https://script.google.com/macros/s/AKfycbz197ippeRAkzRLuBuktihwt4t8Ksra9oarj0-A5qTBHzzbfGGXlQwKj1XfUYQ_eTU/exec';
  var SECRET_TOKEN      = '7R_FM_2026';

  function initWishlist() {
    var overlay   = document.getElementById('wishlist-overlay');
    var closeBtn  = document.getElementById('wishlist-close');
    var form      = document.getElementById('wishlist-form');
    var emailInput = document.getElementById('wishlist-email');
    var emailError    = document.getElementById('wishlist-email-error');
    var consentCheck  = document.getElementById('wishlist-consent');
    var consentError  = document.getElementById('wishlist-consent-error');
    var submitBtn     = document.getElementById('wishlist-submit');
    var successEl     = document.getElementById('wishlist-success');
    var successMsg    = document.getElementById('wishlist-success-body');
    if (!overlay) return;

    // Open wishlist popup when any wishlist button is clicked.
    // Use event delegation so it works after rank-6 re-renders.
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'add-to-wishlist-btn') {
        flashAddToWishlist();
        openWishlist();
      }
    });

    // Close handlers
    closeBtn.addEventListener('click', closeWishlist);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeWishlist();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeWishlist();
    });

    // Form submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim();

      // Basic client-side validation
      emailError.textContent   = '';
      consentError.textContent = '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailInput.focus();
        return;
      }
      if (consentCheck && !consentCheck.checked) {
        consentError.textContent = 'Please confirm your consent to continue.';
        consentCheck.focus();
        return;
      }

      submitBtn.disabled    = true;
      submitBtn.textContent = 'Sending\u2026';

      var payload = {
        token: SECRET_TOKEN,
        email: email,
        items: buildWishlistItems()
      };

      fetch(WISHLIST_ENDPOINT, {
        method:  'POST',
        body:    JSON.stringify(payload)
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          form.hidden        = true;
          successEl.hidden   = false;
          successMsg.textContent = data.isNew
            ? 'Check your inbox \u2014 your exclusive discount code is on its way.'
            : 'You\'re already a First Mover! Check your original confirmation email for your code.';
        } else {
          emailError.textContent = data.error || 'Something went wrong. Please try again.';
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Become a First Mover';
        }
      })
      .catch(function() {
        emailError.textContent = 'Network error. Please check your connection and try again.';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Become a First Mover';
      });
    });
  }

  function openWishlist() {
    var overlay = document.getElementById('wishlist-overlay');
    var form    = document.getElementById('wishlist-form');
    var success = document.getElementById('wishlist-success');
    var submitBtn = document.getElementById('wishlist-submit');
    if (!overlay) return;
    // Reset to form state each open (so re-opening after success is clean)
    form.hidden    = false;
    success.hidden = true;
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Become a First Mover';
    document.getElementById('wishlist-email').value = '';
    document.getElementById('wishlist-email-error').textContent = '';
    overlay.removeAttribute('aria-hidden');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { document.getElementById('wishlist-email').focus(); }, 100);
  }

  function closeWishlist() {
    var overlay = document.getElementById('wishlist-overlay');
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════════════
     LOGIN / VIEW WISHLIST MODAL
  ══════════════════════════════════════════════════ */

  function initLoginModal() {
    var overlay    = document.getElementById('login-overlay');
    var closeBtn   = document.getElementById('login-close');
    var form       = document.getElementById('login-form');
    var emailInput = document.getElementById('login-email');
    var emailError = document.getElementById('login-email-error');
    var submitBtn  = document.getElementById('login-submit');
    var successEl  = document.getElementById('login-success');
    if (!overlay) return;

    // Triggers: header "My Wishlist" button + "View My Wishlist" in wishlist success
    document.addEventListener('click', function(e) {
      if (e.target && (
        e.target.id === 'view-wishlist-trigger' ||
        e.target.id === 'wishlist-view-btn'
      )) {
        closeWishlist();
        openLoginModal();
      }
    });

    closeBtn.addEventListener('click', closeLoginModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeLoginModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeLoginModal();
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = (emailInput.value || '').trim();

      emailError.textContent = '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailInput.focus();
        return;
      }

      submitBtn.disabled    = true;
      submitBtn.textContent = 'Sending\u2026';

      fetch(WISHLIST_ENDPOINT, {
        method: 'POST',
        body:   JSON.stringify({ action: 'login', token: SECRET_TOKEN, email: email })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          form.hidden      = true;
          successEl.hidden = false;
        } else {
          emailError.textContent = data.error || 'Something went wrong. Please try again.';
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Send Me My Link';
        }
      })
      .catch(function() {
        emailError.textContent = 'Network error. Please check your connection and try again.';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Send Me My Link';
      });
    });
  }

  function openLoginModal() {
    var overlay = document.getElementById('login-overlay');
    var form    = document.getElementById('login-form');
    var success = document.getElementById('login-success');
    var submitBtn = document.getElementById('login-submit');
    if (!overlay) return;
    form.hidden      = false;
    success.hidden   = true;
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Send Me My Link';
    document.getElementById('login-email').value = '';
    document.getElementById('login-email-error').textContent = '';
    overlay.removeAttribute('aria-hidden');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { document.getElementById('login-email').focus(); }, 100);
  }

  function closeLoginModal() {
    var overlay = document.getElementById('login-overlay');
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Builds the items array from current STATE for the payload
  function buildWishlistItems() {
    // Use cart items if any exist, otherwise use current garment config
    if (STATE.cart && STATE.cart.length > 0) {
      return STATE.cart.map(function(item) {
        return {
          collection:  item.collection  || '',
          line:        item.lineName    || item.variantName || '',
          garmentType: item.type === 'chessboard' ? 'Chessboards (Turtleneck)' : 'Pieces (Crewneck)',
          variant:     item.variantName || item.lineName || '',
          piece:       item.piece       || '',
          placement:   item.location    || '',
          colorway:    item.colorway    || '',
          size:        item.size        || ''
        };
      });
    }
    // No cart items — capture current in-progress config
    var item = { collection: 'First Move' };
    if (STATE.selectedSubLine === 'chessboards') {
      var v = STATE.selectedCBVariant && CHESSBOARD_VARIANTS[STATE.selectedCBVariant];
      item.garmentType = 'Chessboards (Turtleneck)';
      item.line        = v ? v.name : '';
      item.variant     = v ? v.name : '';
      item.piece       = STATE.selectedCBPiece    || '';
      item.placement   = STATE.selectedCBLocation
        ? (CHESSBOARD_LOCATIONS[STATE.selectedCBLocation] || STATE.selectedCBLocation)
        : '';
      item.size        = STATE.selectedSize || '';
    } else if (STATE.selectedSubLine === 'pieces' && STATE.selectedLine) {
      item.garmentType = 'Pieces (Crewneck)';
      item.line        = STATE.selectedLine.name || '';
      item.variant     = STATE.selectedLine.name || '';
      item.piece       = STATE.selectedPiece    || '';
      item.colorway    = STATE.selectedColorway  || '';
      item.size        = STATE.selectedSize || '';
    }
    return [item];
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
