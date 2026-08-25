# Petal Browser - Ratings & Reviews Service

Official repository for Petal Browser's real-time Ratings & Community Reviews backend automation and web widget frontend.

---

## Features

- **Google Form Intake Integration**:
  - Enforces Google Sign-In (`Limit 1 response`) to prevent duplicate reviews while allowing submission edits.
  - Links directly to master sheet named `'Original form'`.

- **Privacy-Preserving Secondary Sync ('Website')**:
  - Automatically synchronizes responses from `'Original form'` to `'Website'` sheet using Google Apps Script.
  - Filters out sensitive user `Email Address` columns to safeguard user privacy.

- **Lightweight Public CSV Backend Endpoint**:
  - Published via Google Sheets (`File > Share > Publish to web > CSV`).
  - Functions as a serverless public backend endpoint readable by web and mobile clients without requiring API keys or master credentials.

- **Administrative Replies Column**:
  - Column E (`Developer Reply`) in the `'Website'` sheet enables manual or scripted responses mapped directly to each user entry.
  - Apps Script sync preserves developer replies during form submission updates.

- **Material 3 Expressive Web Frontend**:
  - Live average rating calculation and 5-star distribution score bars.
  - Search & filter by star ratings, keywords, or developer reply status.
  - Dark / Light mode theme toggling.
  - Glassmorphic card design system.

---

## Directory Structure

```
petal-ratings-reviews/
├── index.html                   # Web frontend dashboard & review submission portal
├── styles.css                   # Material 3 Expressive styling & responsive design
├── app.js                       # Client-side CSV parser, stats calculator & UI manager
├── google_apps_script/
│   └── Code.gs                  # Apps Script for Original form -> Website sync & privacy filtering
├── SETUP_GUIDE.md               # Complete step-by-step setup documentation
└── README.md                    # Repository documentation
```

---

## Quick Start

1. Follow `SETUP_GUIDE.md` to set up your Google Form, Google Sheets (`Original form` and `Website`), Apps Script trigger, and Publish to Web CSV endpoint.
2. Open `index.html` in any web browser.
3. Enter your published CSV URL in the endpoint input field and click **Load Data**.
