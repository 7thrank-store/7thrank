# 7th Rank — Wishlist Email Flow: Setup Guide

## One-time setup (takes ~10 minutes)

---

### ✅ Step 1 — Create the Google Sheet  *(COMPLETE)*

- Sheet: **"7th Rank — First Movers"** → tab renamed to **"Wishlist Signups"**
- Spreadsheet ID configured in `Code.gs`:
  ```
  14efRw0OvfBn7er-j1eR1Ifu44RAO_i8M47yUWkJNNZM
  ```
- Column headers added to row 1 (A–M): Timestamp, Email, Discount Code, Collection, Line, Garment Type, Variant / Style, Piece, Placement / Colorway, Size, Code Used, Source, Unsubscribed

---

### ✅ Step 2 — Create the Apps Script project  *(COMPLETE)*

- `Code.gs` pasted into the Apps Script editor
- `email_template` HTML file created and pasted with full luxury email design:
  - Logo watermark background
  - Founder letter copy
  - Qf7+ chess puzzle section
  - FM-XXXX-XXXX discount code block
  - Social links (Instagram/TikTok @7th.rank)
  - CAN-SPAM footer (address: 1114 Main Ave, Clifton, NJ 07011; unsubscribe link)

---

### ✅ Step 3 — Deploy as a Web App  *(COMPLETE)*

- Deployed as Web App: Execute as **Me**, access **Anyone**
- Live URL:
  ```
  https://script.google.com/macros/s/AKfycbynjkrlxhyLIu_jAaEkpZ25gFmNBpKzQ2egn_1B-eqsARPAyjt266tl8unjdc3OFpdj/exec
  ```
- URL wired into `website/js/main.js` as `WISHLIST_ENDPOINT`

---

### ✅ Step 4 — Authorize Gmail access  *(COMPLETE)*

- Google OAuth authorization completed on first `testFlow()` run

---

### ✅ Step 5 — Test it  *(COMPLETE)*

- `testFlow()` run successfully — confirmation email received, row written to sheet

> **To re-test at any time**, run `testFlow()` in the Apps Script editor.
> Note: duplicate emails reuse their existing code (by design).

---

### Step 6 — Re-deploy after any code changes

If you ever edit `Code.gs` or `email_template.html`:
1. Re-paste the updated file contents into the Apps Script editor
2. Save (Ctrl+S)
3. **Deploy → Manage deployments**
4. Click the pencil (edit) on your deployment
5. Change version to **"New version"**
6. Click **Deploy**

> The URL stays the same — no need to update `main.js`.

---

### ✅ Step 7 — Make GitHub repo public (images in email)  *(COMPLETE)*

The logo watermark and chess position image in the email are hosted on GitHub Pages.
GitHub Pages requires the repo to be **public**.

1. Go to your repo on GitHub
2. **Settings → General** → scroll to "Danger Zone"
3. **Change visibility → Make public**
4. GitHub Pages will activate at: `https://7thrank-store.github.io/7th-rank-website/`

> GitHub Pages live at: `https://7thrank-store.github.io/7th-rank-website/`

---

### Step 8 — Login / View Wishlist Flow

This feature lets signed-up users view their saved items and discount code via a magic link.

**How it works:**
1. User clicks **"My Wishlist"** in the header nav (or **"View My Wishlist"** after signup)
2. Login modal appears — user enters their email
3. Apps Script checks if email is registered; if yes, generates a 32-char one-time token (24h TTL)
4. Token stored in sheet cols N + O; magic link email sent to user
5. User clicks the link → `doGet` validates token, clears it, renders their wishlist page
6. If link is expired or already used → friendly error page

**New sheet columns (add manually to row 1 if sheet already exists):**
| Col | Field        | Notes                                       |
|-----|--------------|---------------------------------------------|
| N   | Login Token  | Temporary hex token; cleared after one use  |
| O   | Token Expiry | ISO date string; 24h from when link was sent |

**Deploy after code update:**
After pasting the updated `Code.gs` into Apps Script:
1. **Deploy → Manage deployments** → pencil → New version → Deploy

**Testing the login flow:**

Run this in the Apps Script editor (replace with a real registered email):
```js
function testLogin() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'login',
        email:  'your-registered-email@example.com'
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
  // Expected: {"success":true}
  // Check inbox for "Your 7th Rank Wishlist Link" email
  // Click the link — should open luxury wishlist page with discount code
}
```

**Testing with an unregistered email:**
```js
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
```

**Checklist:**
- [ ] Paste updated `Code.gs` into Apps Script editor
- [ ] Save (Ctrl+S) and redeploy as New version
- [ ] Add cols N and O headers to Google Sheet row 1
- [ ] Run `testLogin()` with a registered email — confirm email received
- [ ] Click magic link — confirm wishlist page renders with correct code and items
- [ ] Click link a second time — confirm "Link Expired" page appears
- [ ] On site: click "My Wishlist" in header → login modal opens
- [ ] On site: after wishlist signup, "View My Wishlist" button opens login modal

---

## Spreadsheet columns reference

| Col | Field               | Notes                                    |
|-----|---------------------|------------------------------------------|
| A   | Timestamp           | Date + time of signup                    |
| B   | Email               | Lowercase, trimmed                       |
| C   | Discount Code       | FM-XXXX-XXXX format, unique per email    |
| D   | Collection          | e.g. "First Move"                        |
| E   | Line                | e.g. "Ice Castle" / "Grain"              |
| F   | Garment Type        | "Chessboards (Turtleneck)" or "Pieces"   |
| G   | Variant / Style     | Variant name for chessboards, line name for pieces |
| H   | Piece               | Chess piece selected                     |
| I   | Placement/Colorway  | Location (chessboards) or hex (pieces)   |
| J   | Size                | XS–XXL                                   |
| K   | Code Used           | FALSE on signup; manually set TRUE when redeemed |
| L   | Source              | Always "wishlist" for now                |
| M   | Unsubscribed        | TRUE if user clicked unsubscribe link    |
| N   | Login Token         | Temporary; cleared after one use         |
| O   | Token Expiry        | ISO date string; 24h TTL                 |

---

## Validating a code at checkout (future)

When checkout is built, validate a code server-side:
1. Look up the code in column C of the sheet
2. Check column K (Code Used) is `FALSE`
3. Apply 15% discount
4. Set column K to `TRUE`

This can be done with a second Apps Script function or via the Google Sheets API.
