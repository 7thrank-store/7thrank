# 7th Rank — Wishlist Email Flow: Setup Guide

## One-time setup (takes ~10 minutes)

---

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it **"7th Rank — First Movers"**
3. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/` **`THIS_PART`** `/edit`
4. Paste that ID into `Code.gs` at the top:
   ```js
   var SPREADSHEET_ID = 'paste-your-id-here';
   ```

---

### Step 2 — Create the Apps Script project

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete the default `myFunction()` code
3. Copy the entire contents of `Code.gs` and paste it into the editor
4. Click the **+** next to "Files" and add an HTML file named exactly `email_template`
5. Copy the entire contents of `email_template.html` and paste it in
6. Save both files (Ctrl+S)

---

### Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Set:
   - Description: `7th Rank Wishlist v1`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone** *(required so the website can POST to it)*
4. Click **Deploy**
5. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/XXXXXX/exec`
6. Paste that URL into `website/js/main.js`:
   ```js
   var WISHLIST_ENDPOINT = 'paste-your-url-here';
   ```

---

### Step 4 — Authorize Gmail access

On first run, Apps Script will ask you to authorize it to send emails via your Gmail account.
1. Click **Review permissions**
2. Sign in with the Google account you want emails sent from
3. Click **Allow**

> **Work email note:** If your work email runs on Google Workspace, this will work fine —
> just make sure the account has Gmail enabled. The 1,500/day sending limit applies
> (vs. 100/day for personal Gmail). For launch volume this is more than sufficient.

---

### Step 5 — Test it

Run this function manually inside the Apps Script editor to send yourself a test email:

```js
function testFlow() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        email: 'your-email@example.com',
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
```

---

### Step 6 — Re-deploy after any code changes

If you ever edit `Code.gs` or `email_template.html`:
1. **Deploy → Manage deployments**
2. Click the pencil (edit) on your deployment
3. Change version to **"New version"**
4. Click **Deploy**

> The URL stays the same — no need to update `main.js`.

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

---

## Validating a code at checkout (future)

When checkout is built, validate a code server-side:
1. Look up the code in column C of the sheet
2. Check column K (Code Used) is `FALSE`
3. Apply 15% discount
4. Set column K to `TRUE`

This can be done with a second Apps Script function or via the Google Sheets API.
