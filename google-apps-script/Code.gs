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
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = '14efRw0OvfBn7er-j1eR1Ifu44RAO_i8M47yUWkJNNZM';
var SHEET_NAME     = 'Wishlist Signups';
var SENDER_NAME    = '7th Rank';
var DISCOUNT_PCT   = 15;
// ─────────────────────────────────────────────────────────────────────────────


// ── ENTRY POINTS ──────────────────────────────────────────────────────────────

// GET: handles one-click unsubscribe links from emails
// URL pattern: ?action=unsubscribe&email=<encoded>
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
  return HtmlService.createHtmlOutput('<p>Invalid request.</p>');
}

function markUnsubscribed(email) {
  try {
    var sheet = getOrCreateSheet();
    var data  = sheet.getDataRange().getValues();
    // Column M (index 12) = Unsubscribed flag
    for (var i = 1; i < data.length; i++) {
      if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
        sheet.getRange(i + 1, 13).setValue(true);
      }
    }
  } catch (err) {
    // Log silently — don't surface errors to the user
    console.error('markUnsubscribed error: ' + err.message);
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var email   = (payload.email || '').trim().toLowerCase();
    var items   = payload.items || []; // array of cart item objects

    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, error: 'Invalid email address.' });
    }

    var sheet      = getOrCreateSheet();
    var existCode  = findExistingCode(sheet, email);
    var code       = existCode || generateCode();
    var isNew      = !existCode;
    var now        = new Date();

    if (isNew) {
      // Write one row per item; if no items write one summary row
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
    // Header row
    sheet.appendRow([
      'Timestamp', 'Email', 'Discount Code',
      'Collection', 'Line', 'Garment Type',
      'Variant / Style', 'Piece', 'Placement / Colorway',
      'Size', 'Code Used', 'Source', 'Unsubscribed'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 13);
  }
  return sheet;
}

function findExistingCode(sheet, email) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if ((data[i][1] || '').toString().toLowerCase().trim() === email) {
      return data[i][2]; // return the code from column C
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

  GmailApp.sendEmail(email, 'FIRST MOVERS DISCOUNT!! Wishlist Confirmation', '', {
    name:     SENDER_NAME,
    htmlBody: htmlBody
  });
}
