# Google Forms & Google Sheets Backend Setup Guide

This guide provides the complete end-to-end instructions for configuring an intake Google Form, linked Master Google Sheet (`Original form`), automated Google Apps Script synchronization to a public Sheet (`Website`), and CSV publishing for Petal App Ratings & Reviews.

---

## Architecture Overview

```
 [User Review Submission]
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │ Intake Google Form                           │
 │ • Requires Google Sign-In (Limit 1 response)  │
 │ • Allows Response Editing                    │
 └──────────────────┬───────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │ Master Spreadsheet ('Original form')         │
 │ • Col A: Timestamp                           │
 │ • Col B: Email Address (SENSITIVE)           │
 │ • Col C: Username / Name                     │
 │ • Col D: Rating (1-5)                        │
 │ • Col E: Review Text                         │
 └──────────────────┬───────────────────────────┘
                    │ (Google Apps Script Automated Sync)
                    ▼
 ┌──────────────────────────────────────────────┐
 │ Secondary Public Spreadsheet ('Website')     │
 │ • Col A: Timestamp                           │
 │ • Col B: Username (Email Stripped for Privacy)│
 │ • Col C: Rating (1-5)                        │
 │ • Col D: Review Text                         │
 │ • Col E: Administrative Developer Replies    │
 └──────────────────┬───────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │ Published Web Endpoint (Public CSV)          │
 │ File > Share > Publish to web > CSV          │
 └──────────────────┬───────────────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────────────┐
 │ Petal App Web Frontend Widget (index.html)   │
 │ Live parse CSV & render ratings / replies    │
 └──────────────────────────────────────────────┘
```

---

## Step 1: Configure Intake Google Form

1. Go to [Google Forms](https://forms.google.com) and click **Blank Form**.
2. Set the Title to **Petal Browser - User Ratings & Reviews**.
3. Add the following Form Questions:
   - **Username / Display Name** (Short Answer, Required)
   - **Star Rating** (Linear Scale 1 to 5, Required)
   - **Review / Feedback** (Paragraph, Required)
4. Open Form **Settings**:
   - Under **Responses**:
     - Turn **ON** `Collect email addresses` (or `Require Sign-in`).
     - Turn **ON** `Limit to 1 response` (enforces Google sign-in to prevent duplicate reviews).
     - Turn **ON** `Allow response editing` (allows users to edit their existing review).
5. Link Form to Google Sheets:
   - Click the **Responses** tab in Google Forms.
   - Click **Link to Sheets** (green spreadsheet icon).
   - Select **Create a new spreadsheet** and name it **Original form**.

---

## Step 2: Configure Secondary Sheet ('Website') & Apps Script Sync

1. Open your master spreadsheet (**Original form**).
2. Click **Extensions** > **Apps Script** from the top menu.
3. Replace all content in `Code.gs` with the provided script located in `google_apps_script/Code.gs`:

```javascript
const MASTER_SHEET_NAME = 'Original form';
const PUBLIC_SHEET_NAME = 'Website';

function syncFormResponsesToWebsite() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(MASTER_SHEET_NAME) || ss.getSheets()[0];
  let publicSheet = ss.getSheetByName(PUBLIC_SHEET_NAME) || ss.insertSheet(PUBLIC_SHEET_NAME);
  
  const masterData = masterSheet.getDataRange().getValues();
  let existingRepliesMap = new Map();
  
  if (publicSheet.getLastRow() > 1) {
    const publicData = publicSheet.getDataRange().getValues();
    for (let i = 1; i < publicData.length; i++) {
      const row = publicData[i];
      const timestamp = String(row[0]);
      const reply = row[4] ? String(row[4]) : '';
      if (timestamp && reply) {
        existingRepliesMap.set(timestamp, reply);
      }
    }
  }
  
  const publicRows = [["Timestamp", "Username", "Rating", "Review", "Developer Reply"]];
  
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const timestamp = String(row[0] || '');
    const username = row[2] || row[1] || 'Anonymous';
    const rating = row[3] || 5;
    const review = row[4] || '';
    const existingReply = existingRepliesMap.get(timestamp) || '';
    
    publicRows.push([timestamp, username, rating, review, existingReply]);
  }
  
  publicSheet.clearContents();
  publicSheet.getRange(1, 1, publicRows.length, 5).setValues(publicRows);
  publicSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#6750A4").setFontColor("#FFFFFF");
}

function setupAutoSyncTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('syncFormResponsesToWebsite')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
}
```

4. Click **Save** (disk icon).
5. Select the `setupAutoSyncTrigger` function from the dropdown toolbar and click **Run**.
6. Grant the required permissions when prompted. This creates an automated `onFormSubmit` trigger that runs `syncFormResponsesToWebsite()` every time a user submits or edits a review.

---

## Step 3: Publish 'Website' Sheet as CSV Endpoint

1. In your Google Sheet, switch to the **Website** sheet tab.
2. Click **File** > **Share** > **Publish to web**.
3. Under **Link**:
   - Change `Entire Document` to **Website**.
   - Change `Web page` to **Comma-separated values (.csv)**.
4. Click **Publish** and copy the generated CSV URL endpoint (e.g., `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=...&single=true&output=csv`).

---

## Step 4: Administrative Replies & Public Backend Verification

- **Administrative Replies**: To reply to any review, simply open the **Website** tab in your Google Sheet and type your response into **Column E** (`Developer Reply`) corresponding to that user's row.
- **Data Persistence**: When new reviews are submitted or edited via Google Form, the `syncFormResponsesToWebsite` Apps Script automatically updates the rows while preserving your Column E administrative replies.
- **Privacy & Credentials**: The public CSV endpoint ONLY exposes the **Website** tab (`Timestamp`, `Username`, `Rating`, `Review`, `Developer Reply`). Sensitive user email addresses in Column B of **Original form** remain completely private.

---

## Step 5: Web Frontend Connection

1. Open `index.html` in your browser.
2. Paste your published Google Sheets CSV URL into the **Public CSV Backend Endpoint** input box.
3. Click **Load Data** to view live ratings, distribution stats, and reviews!
