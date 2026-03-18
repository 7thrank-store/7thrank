# Contact Form — Google Apps Script Setup

This document walks you through deploying a Google Apps Script web app that receives
contact form submissions from the 7th Rank website and forwards them to
**7thranksupport@gmail.com**.

---

## Overview

The contact form POSTs a JSON payload to a Google Apps Script URL. The script
reads the payload and sends a formatted email to your support address. No
third-party services, no monthly fees, no rate limits for reasonable volume.

---

## Step 1 — Open Google Apps Script

1. Go to [script.google.com](https://script.google.com) and sign in with the
   **7thranksupport@gmail.com** Google account (important — this is the account
   whose `MailApp` quota will be used, and where the email will arrive).
2. Click **New project** (top-left).
3. Rename the project to something like `7th Rank — Contact Form`.

---

## Step 2 — Paste the Script

Delete the default `function myFunction() {}` and replace the entire editor
contents with the code below:

```javascript
var RECIPIENT = '7thranksupport@gmail.com';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action !== 'contact') {
      return jsonResponse({ ok: false, error: 'Unknown action.' });
    }

    var name    = (data.name    || '').trim();
    var email   = (data.email   || '').trim();
    var message = (data.message || '').trim();

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, error: 'Missing fields.' });
    }

    var subject = '7th Rank — Message from ' + name;
    var body =
      'New message via the 7th Rank website contact form.\n\n' +
      'Name:    ' + name    + '\n' +
      'Email:   ' + email   + '\n' +
      'Message:\n' + message + '\n\n' +
      '---\nReply directly to this email to respond to ' + name + '.';

    MailApp.sendEmail({
      to:       RECIPIENT,
      replyTo:  email,
      subject:  subject,
      body:     body
    });

    return jsonResponse({ ok: true });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Click the **Save** icon (or `Ctrl+S` / `Cmd+S`).

---

## Step 3 — Deploy as a Web App

1. In the top-right, click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Fill in the fields:
   - **Description**: `Contact form v1`
   - **Execute as**: `Me (7thranksupport@gmail.com)`
   - **Who has access**: `Anyone`  ← this is required for the website fetch to work
4. Click **Deploy**.
5. Google will ask you to **Authorize** the script — click through the
   permissions prompt (you will see "This app isn't verified" — click
   **Advanced → Go to 7th Rank — Contact Form (unsafe)** and then **Allow**).
   This is normal for self-owned scripts.
6. Copy the **Web app URL** that appears — it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   Keep this URL handy.

---

## Step 4 — Add the URL to the Website

Open `website/js/main.js` and find this line near the top of the
`WISHLIST / FIRST MOVER EMAIL FLOW` section:

```javascript
var CONTACT_ENDPOINT = '';
```

Replace the empty string with your deployed URL:

```javascript
var CONTACT_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';
```

Save the file, commit, and push.

---

## Step 5 — Test It

1. Open the live site, navigate to the **Contact** section (rank 7).
2. Fill in Name, Email, and Message — use a real email for the sender.
3. Click **Make Your Move →**.
4. The site should scroll to the confirmation screen.
5. Check **7thranksupport@gmail.com** — you should receive the email within
   seconds. The `Reply-To` header is set to the sender's email, so hitting
   reply in Gmail will go straight back to them.

If the email doesn't arrive, see Troubleshooting below.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| No email received | Check Apps Script **Executions** log (left sidebar → clock icon) for errors |
| `Exception: You do not have permission` | Ensure you authorized the script in Step 3 |
| `cors` / network error in browser console | Make sure **Who has access** is set to `Anyone`, not `Anyone with Google account` |
| Form advances to confirm but email never arrives | Check spam folder; Gmail may initially flag the script sender |
| `Invalid JSON` error in Executions log | Ensure `CONTACT_ENDPOINT` in `main.js` is the `/exec` URL, not the `/dev` URL |

---

## Re-deploying After Script Changes

If you ever edit the Apps Script code, you **must create a new deployment** to
publish the changes — editing the code alone does not update the live endpoint.

1. **Deploy → New deployment**
2. Fill in the same settings as Step 3
3. Copy the new URL and update `CONTACT_ENDPOINT` in `main.js`

Alternatively, use **Deploy → Manage deployments → Edit** on the existing
deployment and change the version to `New version` — this updates the same URL.

---

## Daily Email Quota

`MailApp.sendEmail()` is limited to **100 emails/day** on a free Google account.
For the contact form this is more than enough. The wishlist/magic-link flow uses
the same quota via its own separate Apps Script project, so they don't compete.
