/**
 * 7th Rank — Wishlist / First Mover Email Flow
 * Google Apps Script Web App
 *
 * Deploy as: Execute as → Me | Who has access → Anyone
 * Sheet name must match SHEET_NAME below.
 *
 * Columns:
 *  A  Timestamp
 *  B  Email
 *  C  Discount Code
 *  D  Collection
 *  E  Line
 *  F  Garment Type  (Chessboards / Pieces)
 *  G  Variant / Style
 *  H  Piece
 *  I  Placement / Colorway
 *  J  Size
 *  K  Code Used     (FALSE on signup)
 *  L  Source
 *  M  Unsubscribed
 *  N  Login Token   (temporary, cleared after use)
 *  O  Token Expiry  (ISO string, 24h TTL)
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = '14efRw0OvfBn7er-j1eR1Ifu44RAO_i8M47yUWkJNNZM';
var SHEET_NAME     = 'Wishlist Signups';
var SENDER_NAME    = '7th Rank';
var DISCOUNT_PCT   = 15;
var SITE_URL       = 'https://7thrank-store.github.io/7thrank/';
// ─────────────────────────────────────────────────────────────────────────────


// ── ENTRY POINTS ──────────────────────────────────────────────────────────────

// GET: handles unsubscribe and magic-link wishlist view
// Patterns:
//   ?action=unsubscribe&email=<encoded>
//   ?action=view-wishlist&email=<encoded>&token=<hex>
function doGet(e) {
  var params = e ? (e.parameter || {}) : {};

  if (params.action === 'unsubscribe' && params.email) {
    var email = decodeURIComponent(params.email).toLowerCase().trim();
    markUnsubscribed(email);
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#060D14;color:#B8CDD8;">' +
      '<h2 style="color:#C9A84C;">Unsubscribed</h2>' +
      '<p>You have been removed from 7th Rank marketing emails.</p>' +
      '</body></html>'
    );
  }

  if (params.action === 'view-wishlist' && params.email && params.token) {
    var email = decodeURIComponent(params.email).toLowerCase().trim();
    var token = params.token;
    var sheet = getOrCreateSheet();
    if (validateAndClearToken(sheet, email, token)) {
      var data = getWishlistForEmail(sheet, email);
      return renderWishlistPage(email, data);
    }
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#060D14;color:#B8CDD8;">' +
      '<h2 style="color:#C9A84C;">Link Expired</h2>' +
      '<p>This link has already been used or has expired. Please request a new one from the website.</p>' +
      '<p style="margin-top:2rem;"><a href="' + SITE_URL + '" style="color:#C9A84C;">Return to 7th Rank &rarr;</a></p>' +
      '</body></html>'
    );
  }

  return HtmlService.createHtmlOutput('<p>Invalid request.</p>');
}

function markUnsubscribed(email) {
  try {
    var sheet = getOrCreateSheet();
    var data  = sheet.getDataRange().getValues();
    // Iterate in reverse so row deletions don't shift subsequent indices
    for (var i = data.length - 1; i >= 1; i--) {
      if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (err) {
    console.error('markUnsubscribed error: ' + err.message);
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var email   = (payload.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, error: 'Invalid email address.' });
    }

    // ── LOGIN: send magic link ─────────────────────────────────────────────
    if (payload.action === 'login') {
      var sheet   = getOrCreateSheet();
      var exists  = findExistingCode(sheet, email);
      if (!exists) {
        return jsonResponse({ success: false, error: 'No wishlist found for that email address.' });
      }
      var token      = generateToken();
      var expiry     = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h TTL
      storeLoginToken(sheet, email, token, expiry);
      var scriptUrl  = ScriptApp.getService().getUrl();
      sendMagicLinkEmail(email, token, scriptUrl);
      return jsonResponse({ success: true });
    }

    // ── WISHLIST SIGNUP ────────────────────────────────────────────────────
    var items      = payload.items || [];
    var sheet      = getOrCreateSheet();
    var existCode  = findExistingCode(sheet, email);
    var code       = existCode || generateCode();
    var isNew      = !existCode;
    var now        = new Date();

    if (isNew) {
      var rows = items.length > 0 ? items : [{}];
      rows.forEach(function(item) {
        sheet.appendRow([
          now,                                          // A  Timestamp
          email,                                        // B  Email
          code,                                         // C  Discount Code
          item.collection  || '',                       // D  Collection
          item.line        || '',                       // E  Line
          item.garmentType || '',                       // F  Garment Type
          item.variant     || '',                       // G  Variant / Style
          item.piece       || '',                       // H  Piece
          item.placement   || item.colorway || '',      // I  Placement / Colorway
          item.size        || '',                       // J  Size
          false,                                        // K  Code Used
          'wishlist'                                    // L  Source
        ]);
      });

      sendConfirmationEmail(email, code, items);
    }

    return jsonResponse({
      success:  true,
      isNew:    isNew,
      code:     code,
      message:  isNew
        ? 'Check your email for your discount code!'
        : 'You\'re already a First Mover! Check your original confirmation email.'
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}


// ── LOGIN / MAGIC LINK ────────────────────────────────────────────────────────

function generateToken() {
  var chars = 'abcdef0123456789';
  var token = '';
  for (var i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// Store token + expiry on the FIRST row matching this email (col N=14, O=15)
function storeLoginToken(sheet, email, token, expiry) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
      sheet.getRange(i + 1, 14).setValue(token);
      sheet.getRange(i + 1, 15).setValue(expiry.toISOString());
      return;
    }
  }
}

// Returns true if token matches and hasn't expired; clears token on success (one-time use)
function validateAndClearToken(sheet, email, token) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
      var storedToken  = (data[i][13] || '').toString();
      var storedExpiry = (data[i][14] || '').toString();
      if (!storedToken || storedToken !== token) return false;
      if (storedExpiry) {
        var expiry = new Date(storedExpiry);
        if (isNaN(expiry.getTime()) || new Date() > expiry) return false;
      }
      // Clear after use
      sheet.getRange(i + 1, 14).setValue('');
      sheet.getRange(i + 1, 15).setValue('');
      return true;
    }
  }
  return false;
}

// Collect all wishlist rows for an email, return { code, items[] }
function getWishlistForEmail(sheet, email) {
  var data  = sheet.getDataRange().getValues();
  var code  = '';
  var items = [];
  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
      if (!code) code = data[i][2];
      var garmentType = (data[i][5] || '').toString();
      var variant     = (data[i][6] || '').toString();
      var piece       = (data[i][7] || '').toString();
      if (garmentType || variant || piece) {
        items.push({
          garmentType: garmentType,
          variant:     variant,
          piece:       piece,
          placement:   (data[i][8] || '').toString(),
          size:        (data[i][9] || '').toString()
        });
      }
    }
  }
  return { code: code, items: items };
}

function sendMagicLinkEmail(email, token, scriptUrl) {
  var loginUrl = scriptUrl +
    '?action=view-wishlist&email=' + encodeURIComponent(email) +
    '&token=' + token;

  var htmlBody =
    '<div style="margin:0;padding:0;background:#060D14;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#060D14;">' +
    '<tr><td align="center" style="padding:40px 16px;">' +
    '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0D1B2A;border:1px solid #1C2B38;">' +
      '<tr><td style="padding:40px 40px 32px;">' +
        '<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.25em;color:#C9A84C;text-transform:uppercase;">7th Rank</p>' +
        '<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:26px;letter-spacing:0.08em;color:#F0D9B5;font-weight:normal;">View Your Wishlist</h1>' +
        '<p style="margin:0 0 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#B8CDD8;">' +
          'Click the button below to view your saved items and exclusive First Mover discount code. ' +
          'This link expires in 24 hours and can only be used once.' +
        '</p>' +
        '<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">' +
          '<tr><td style="background:#C9A84C;">' +
            '<a href="' + loginUrl + '" style="display:inline-block;padding:15px 36px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;color:#060D14;text-decoration:none;">VIEW MY WISHLIST &rarr;</a>' +
          '</td></tr>' +
        '</table>' +
        '<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#3d5060;border-top:1px solid #1C2B38;padding-top:20px;">' +
          'If you didn\'t request this, you can safely ignore this email.' +
        '</p>' +
      '</td></tr>' +
    '</table>' +
    '</td></tr></table></div>';

  GmailApp.sendEmail(email, 'Your 7th Rank Wishlist Link', '', {
    name:     SENDER_NAME,
    htmlBody: htmlBody
  });
}

function renderWishlistPage(email, data) {
  var code  = data.code  || '';
  var items = data.items || [];

  var itemRows = items.length > 0
    ? items.map(function(item) {
        return '<tr>' +
          '<td>' + escHtml(item.garmentType) + '</td>' +
          '<td>' + escHtml(item.variant)     + '</td>' +
          '<td>' + escHtml(item.piece)       + '</td>' +
          '<td>' + escHtml(item.placement)   + '</td>' +
          '<td>' + escHtml(item.size)        + '</td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="5" class="empty">No specific items saved — your discount code is still valid on any item.</td></tr>';

  var html =
    '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>My Wishlist — 7th Rank</title>' +
    '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0;}' +
      'body{background:#060D14;font-family:sans-serif;color:#B8CDD8;min-height:100vh;}' +
      '.wrap{max-width:680px;margin:0 auto;padding:56px 24px;}' +
      '.brand{font-size:11px;letter-spacing:0.25em;color:#C9A84C;text-transform:uppercase;margin-bottom:6px;}' +
      'h1{font-size:26px;letter-spacing:0.12em;color:#F0D9B5;margin-bottom:40px;}' +
      '.code-box{background:#0D1D2A;border:1px solid #C9A84C;border-radius:4px;padding:32px;text-align:center;margin-bottom:40px;}' +
      '.code-label{font-size:10px;letter-spacing:0.22em;color:#C9A84C;text-transform:uppercase;margin-bottom:14px;}' +
      '.code-val{font-size:34px;font-weight:900;color:#F0D9B5;letter-spacing:0.15em;font-family:monospace;}' +
      '.code-note{font-size:12px;color:#5a6a74;margin-top:10px;}' +
      'h2{font-size:11px;letter-spacing:0.18em;color:#C9A84C;text-transform:uppercase;margin-bottom:14px;}' +
      'table{width:100%;border-collapse:collapse;}' +
      'th{text-align:left;font-size:10px;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;' +
         'padding:10px 14px;border-bottom:1px solid #1C2B38;}' +
      'td{padding:13px 14px;color:#B8CDD8;font-size:14px;border-bottom:1px solid #0D1D2A;}' +
      'td.empty{color:#3a4a54;text-align:center;padding:28px;}' +
    '</style></head><body>' +
    '<div class="wrap">' +
      '<div class="brand">7th Rank</div>' +
      '<h1>Your First Mover Wishlist</h1>' +
      '<div class="code-box">' +
        '<div class="code-label">Your Exclusive Discount Code</div>' +
        '<div class="code-val">' + escHtml(code) + '</div>' +
        '<div class="code-note">' + DISCOUNT_PCT + '% off your first order &mdash; single use, unique to you</div>' +
      '</div>' +
      '<h2>Saved Items</h2>' +
      '<table><thead><tr>' +
        '<th>Garment</th><th>Variant</th><th>Piece</th><th>Placement</th><th>Size</th>' +
      '</tr></thead><tbody>' + itemRows + '</tbody></table>' +
    '</div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('My Wishlist — 7th Rank');
}

function escHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ── UTILITIES ─────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 (ambiguous)
  function seg(len) {
    var s = '';
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  return 'FM-' + seg(4) + '-' + seg(4);
}

function getOrCreateSheet() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Email', 'Discount Code',
      'Collection', 'Line', 'Garment Type',
      'Variant / Style', 'Piece', 'Placement / Colorway',
      'Size', 'Code Used', 'Source', 'Unsubscribed',
      'Login Token', 'Token Expiry'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.autoResizeColumns(1, 15);
  }
  return sheet;
}

function findExistingCode(sheet, email) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
      return data[i][2];
    }
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── EMAIL ─────────────────────────────────────────────────────────────────────

// ── TEST FUNCTIONS (run manually from Apps Script editor) ─────────────────────

function testFlow() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        email: 'your-email@example.com',   // ← replace with your email
        items: [{
          collection:  'First Move',
          line:        'Ice Castle',
          garmentType: 'Chessboards (Turtleneck)',
          variant:     'Ice Castle',
          piece:       'Knight',
          placement:   'Left Chest',
          size:        'M'
        }]
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}

function testLogin() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'login',
        email:  'your-email@example.com'   // ← must already be in the sheet
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
  // Expected: {"success":true}
  // Check inbox for "Your 7th Rank Wishlist Link" — click it to view wishlist page
}

function testLoginNotFound() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'login',
        email:  'notregistered@example.com'
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
  // Expected: {"success":false,"error":"No wishlist found for that email address."}
}

// ── EMAIL ─────────────────────────────────────────────────────────────────────

function sendConfirmationEmail(email, code, items) {
  var scriptUrl    = ScriptApp.getService().getUrl();
  var unsubUrl     = scriptUrl + '?action=unsubscribe&email=' + encodeURIComponent(email);

  var template = HtmlService.createTemplateFromFile('email_template');
  template.code           = code;
  template.discountPct    = DISCOUNT_PCT;
  template.items          = items;
  template.hasItems       = items.length > 0;
  template.unsubscribeUrl = unsubUrl;

  var htmlBody = template.evaluate().getContent();

  GmailApp.sendEmail(email, 'Your 15% off code is here — Welcome to 7th Rank', '', {
    name:     SENDER_NAME,
    htmlBody: htmlBody
  });
}
