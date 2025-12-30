# Personal Dashboard — Sync & PWA Guide

This project is a static personal dashboard. Below are steps to connect it to Google Sheets, enable PWA features and set up push notifications.

## 1) Google Sheets (Apps Script) — quick sync

### Important: Web App vs Library

**The sync feature requires a Web App deployment, NOT a library.** A library endpoint cannot handle POST requests due to CORS restrictions.

### Using provided endpoint (easiest):

A Google Apps Script Web App is already set up and deployed. When you click **Sync to Google Sheet**, the app will default to using this endpoint:
```
https://script.google.com/macros/s/AKfycbycuXi5fjPFYCtqBKOTuOrnsRNAdhBoFZn5otC9njiaoL2x_rJb2iJqOJN3H7DY3zb_/exec
```

It will ask for confirmation before syncing. Just click **OK** to use the default. Your habit entries will sync directly to the Google Sheet.

### Setting up your own Apps Script (recommended for reliability):

If you want to use your own Google Sheet instead:

1. Create a new Google Sheet.
2. Open Extensions → Apps Script.
3. Replace the default `Code.gs` with:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('Sheet1');
    const payload = JSON.parse(e.postData.contents);
    // Add columns as needed: timestamp, date, data
    sheet.appendRow([new Date(), payload.date, JSON.stringify(payload)]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Deploy → New deployment → Select `Web app`.
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the **Web App URL** (it should look like: `https://script.google.com/macros/s/SCRIPT_ID/usercontent` or `https://script.google.com/macros/s/SCRIPT_ID/usercontent`).
6. In the dashboard, click `Sync to Google Sheet` and when prompted, choose "Cancel" to provide your custom URL.
7. Paste your Web App URL and the app will save it for future syncs.

Notes: Apps Script has quotas and CORS limitations but works well for simple personal syncing.

## Troubleshooting Sync Issues

**Error: "unable to fetch" or "CORS error"?**
- Make sure your endpoint is a **Web App deployment**, not a library.
- Verify the deployment has **access: Anyone**.
- Check that the URL starts with `https://script.google.com/macros/s/` (not `/macros/library/`).
- Open the browser console (F12 → Console) to see detailed error messages.

**To redeploy or update your endpoint:**
- Click `Sync to Google Sheet` and choose "Cancel" to override the saved endpoint.
- Enter a new Web App URL and the app will use it for all future syncs.

## 2) PWA & Push Notifications (overview)

- The app includes `manifest.json` and a basic `service-worker.js`.
- Registering a service worker enables "Add to Home screen" on Android browsers.
- To send push notifications you need a push server (e.g., Firebase Cloud Messaging) to deliver push messages to subscribed clients.

Quick steps to make it fully push-capable:

1. Create a Firebase project, enable Cloud Messaging.
2. Add Firebase SDK to the web app and initialize with your config.
3. Use Firebase Cloud Messaging to obtain the client's FCM token and send it to your server.
4. Use Firebase Admin SDK or Cloud Functions to send scheduled push messages to the device tokens.

I can add a Firebase integration scaffold (client and server snippets) if you'd like.

## 3) Hosting

- GitHub Pages: push the repo and enable Pages in repo settings. The app will be served as static files and is accessible from Android browsers.
- For service worker to work correctly, host over HTTPS (GitHub Pages uses HTTPS).

## 4) Android Access & Reminders

- After hosting, open the site URL on your Android device and `Add to Home screen` for app-like access.
- For reminders: use Firebase Cloud Messaging + a scheduler (Cloud Functions or a cron job) to send pushes at desired times.

---

If you want, I can:
- Add a small Firebase client scaffold for FCM registration.
- Add server/cloud function sample to send scheduled reminders.
- Wire the app so the `Enable Reminders` button starts FCM registration.
