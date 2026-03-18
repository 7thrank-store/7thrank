# Wishlist Apps Script — Required Updates for Checkout

Two new action handlers need to be added to the existing `Code.gs` to support:
1. **Promo code validation** — checks a code against column C of the sheet
2. **Newsletter signup at order** — enrolls a customer who checked "Join First Movers" at checkout

---

## Which file to edit

Open the **existing** Apps Script project (the one with `Code.gs` and
`email_template.html` already in it — the wishlist / First Mover flow).

> [script.google.com](https://script.google.com) → sign in as
> **7thrankhelp@gmail.com** → open the **"7th Rank — First Mover / Wishlist"**
> project.

You are editing `Code.gs` only. `email_template.html` does not need to change.

---

## Where to paste the new code

Both blocks go **inside `doPost`**, immediately after the opening
`try {` block — **before** the email validation check — because `validateCode`
doesn't carry an email field.

Find this line in `doPost`:

```javascript
var payload = JSON.parse(e.postData.contents);
var email   = (payload.email || '').trim().toLowerCase();
```

Paste the `validateCode` block right after `JSON.parse`, before the
`isValidEmail` check:

```javascript
// ── VALIDATE PROMO CODE (checkout) ────────────────────────────────────────
if (payload.action === 'validateCode') {
  var code = (payload.code || '').toString().trim().toUpperCase();
  if (!code) return jsonResponse({ ok: true, valid: false });

  var sheet  = getOrCreateSheet();
  var data   = sheet.getDataRange().getValues();
  var valid  = false;

  for (var r = 1; r < data.length; r++) {
    var sheetCode = (data[r][2] || '').toString().trim().toUpperCase(); // Col C = Discount Code
    var codeUsed  = data[r][10];                                         // Col K = Code Used
    if (sheetCode === code && codeUsed !== true && codeUsed !== 'TRUE') {
      valid = true;
      break;
    }
  }

  return jsonResponse({ ok: true, valid: valid });
}
```

Then, **after** the `isValidEmail` check (but before the `login` action block),
paste the `newsletter` block:

```javascript
// ── NEWSLETTER SIGNUP AT ORDER ────────────────────────────────────────────
if (payload.action === 'newsletter') {
  var name  = (payload.name || '').toString().trim();
  var sheet = getOrCreateSheet();
  var existingCode = findExistingCode(sheet, email);

  if (existingCode) {
    // Already a First Mover — re-send their existing code, no new row
    sendConfirmationEmail(email, existingCode, []);
    return jsonResponse({ success: true, isNew: false });
  }

  var code = generateCode();
  var now  = new Date();
  sheet.appendRow([
    now,              // A  Timestamp
    email,            // B  Email
    code,             // C  Discount Code
    '',               // D  Collection
    '',               // E  Line
    '',               // F  Garment Type
    '',               // G  Variant / Style
    '',               // H  Piece
    '',               // I  Placement / Colorway
    '',               // J  Size
    false,            // K  Code Used
    'order_checkout'  // L  Source
  ]);

  sendConfirmationEmail(email, code, []);
  return jsonResponse({ success: true, isNew: true });
}
```

---

## Notes on the existing helpers used

- `getOrCreateSheet()` — already defined, returns the "Wishlist Signups" sheet
- `findExistingCode(sheet, email)` — already defined, returns the code string or `null`
- `generateCode()` — already defined, returns `FM-XXXX-XXXX` format
- `sendConfirmationEmail(email, code, items)` — already defined, uses `email_template.html`.
  Passing `items = []` means `hasItems` will be `false` in the template, so the
  "Your Saved Wishlist" section will be hidden automatically — no template changes needed.

---

## Redeploy after saving

1. Save `Code.gs` (`Ctrl+S` / `Cmd+S`)
2. **Deploy → Manage deployments**
3. Click the pencil on your existing deployment
4. Set version to **New version**
5. Click **Deploy**

The URL stays the same — no changes needed in `main.js`.

---

## Testing

**validateCode** — run this test function in the Apps Script editor:
```javascript
function testValidateCode() {
  // Replace with a real code from column C of the sheet
  var mockEvent = {
    postData: { contents: JSON.stringify({ action: 'validateCode', code: 'FM-XXXX-XXXX' }) }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
  // Expected (valid code, not yet used): {"ok":true,"valid":true}
  // Expected (invalid / already used):  {"ok":true,"valid":false}
}
```

**newsletter** — run this test function:
```javascript
function testNewsletterSignup() {
  var mockEvent = {
    postData: { contents: JSON.stringify({
      action: 'newsletter',
      email:  'your-test-email@example.com',  // ← use a real address
      name:   'Test User'
    })}
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
  // Expected: {"success":true,"isNew":true}
  // Check inbox — should receive the standard First Mover email with discount code
  // Check spreadsheet — new row should appear with Source = "order_checkout"
}
```

On the live site: go through checkout, check "Join First Movers", enter a real
email, place an order — the email should arrive within seconds and a new row
should appear in the sheet.
