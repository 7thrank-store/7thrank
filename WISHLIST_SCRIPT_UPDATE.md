# Wishlist Apps Script — Required Updates

Two new actions need to be added to the existing **Wishlist Apps Script** to
support (1) promo code validation at checkout and (2) First Mover newsletter
signup from the order flow.

---

## Which script to edit

This is the **same script** that handles the wishlist/magic-link flow — NOT
the Contact Form script. Open it at:

> [script.google.com](https://script.google.com) → sign in as
> **7thrankhelp@gmail.com** → open the project named for the wishlist/First
> Mover flow.

---

## Action 1 — `validateCode` (promo code validation)

The checkout promo field now POSTs:
```json
{ "action": "validateCode", "code": "FM-XXXX" }
```
The script must look up `code` in the **Codes** column of the spreadsheet and
return whether it exists.

Add this block inside your `doPost` function, alongside the existing action
handlers:

```javascript
if (data.action === 'validateCode') {
  var code = (data.code || '').toString().trim().toUpperCase();
  if (!code) return jsonResponse({ ok: true, valid: false });

  var sheet = SpreadsheetApp.openById('14efRw0OvfBn7er-j1eR1Ifu44RAO_i8M47yUWkJNNZM')
                            .getActiveSheet();
  var values = sheet.getDataRange().getValues();

  // Find the column index that contains discount codes
  // Adjust the header name below to match your sheet exactly
  var headers = values[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  var codeCol = headers.indexOf('code');   // e.g. "Code" column
  if (codeCol === -1) codeCol = headers.indexOf('discount code');

  var valid = false;
  for (var r = 1; r < values.length; r++) {
    var cell = (values[r][codeCol] || '').toString().trim().toUpperCase();
    if (cell === code) { valid = true; break; }
  }

  return jsonResponse({ ok: true, valid: valid });
}
```

**Important**: Check your spreadsheet's column header name and update
`'code'` / `'discount code'` in the `indexOf` call above to match exactly.

---

## Action 2 — `newsletter` (First Mover signup at order placement)

When a customer checks "Join First Movers" at checkout and places their order,
the site POSTs:
```json
{ "action": "newsletter", "email": "customer@example.com", "name": "Jane" }
```
This should enroll them as a First Mover (same spreadsheet, same discount code
email), but without requiring wishlist items.

Add this block inside `doPost`:

```javascript
if (data.action === 'newsletter') {
  var email = (data.email || '').toString().trim().toLowerCase();
  var name  = (data.name  || '').toString().trim();
  if (!email) return jsonResponse({ ok: false, error: 'No email.' });

  var ss    = SpreadsheetApp.openById('14efRw0OvfBn7er-j1eR1Ifu44RAO_i8M47yUWkJNNZM');
  var sheet = ss.getActiveSheet();
  var values = sheet.getDataRange().getValues();

  var headers = values[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  var emailCol = headers.indexOf('email');
  var codeCol  = headers.indexOf('code');
  if (emailCol === -1 || codeCol === -1) {
    return jsonResponse({ ok: false, error: 'Sheet columns not found.' });
  }

  // Check if already a First Mover
  for (var r = 1; r < values.length; r++) {
    var existing = (values[r][emailCol] || '').toString().trim().toLowerCase();
    if (existing === email) {
      // Already enrolled — send their existing code again
      var existingCode = (values[r][codeCol] || '').toString().trim();
      sendFirstMoverEmail(email, name, existingCode, false);
      return jsonResponse({ ok: true, isNew: false });
    }
  }

  // New First Mover — generate code and add row
  var newCode = generateCode();
  // Add a new row — adjust column order to match your sheet
  // This appends: Email | Name | Code | Signup Source | Date
  sheet.appendRow([email, name, newCode, 'Order Checkout', new Date()]);

  sendFirstMoverEmail(email, name, newCode, true);
  return jsonResponse({ ok: true, isNew: true });
}
```

This reuses the existing `generateCode()` and `sendFirstMoverEmail()` helpers
already in your script. If your helper function names differ, adjust accordingly.

---

## Redeploy after changes

After saving both new blocks:

1. **Deploy → Manage deployments → Edit** the existing deployment
2. Set version to **New version**
3. Click **Deploy**

The URL does not change — no update needed in `main.js`.

---

## Testing

**validateCode:**
Use your browser's DevTools console on the live site — open checkout, enter a
real code from the spreadsheet, click Apply. Should show "Applied ✓" and the
total breakdown should show a 15% discount line.

**newsletter:**
Check "Join First Movers" at checkout, enter a real email, place an order. The
email should receive a First Mover welcome + discount code within seconds.
Check the spreadsheet to confirm a new row was added with `Order Checkout` as
the source.
