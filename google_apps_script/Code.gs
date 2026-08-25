/**
 * Petal App Ratings & Reviews - Automated Synchronization Script
 * 
 * Architecture:
 * 1. Master Sheet ('Original form'): Form responses containing sensitive emails (Col B).
 * 2. Secondary Sheet ('Website'): Sanitized public dataset with Email stripped out + Admin 'Developer Reply' column (Col E).
 * 3. Automatic Trigger: Runs on form submission to sync data without exposing emails or wiping existing replies.
 */

// OPTIONAL: If creating script standalone via script.google.com instead of inside Google Sheets (Extensions > Apps Script),
// paste your Google Sheet URL or ID below:
const SPREADSHEET_ID_OR_URL = 'https://docs.google.com/spreadsheets/d/13mwnx_aX9OUpKG96YBAVQYG5yKbSI9f1Q5U4AOJF3e4/edit?usp=drivesdk'; 

const MASTER_SHEET_NAME = 'Original form';
const PUBLIC_SHEET_NAME = 'Website';

/**
 * Safely resolves the target spreadsheet whether container-bound or standalone.
 */
function getTargetSpreadsheet() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss && typeof SPREADSHEET_ID_OR_URL !== 'undefined' && SPREADSHEET_ID_OR_URL.trim() !== '') {
    let input = SPREADSHEET_ID_OR_URL.trim();
    let sheetId = input;
    if (input.includes('/d/')) {
      sheetId = input.split('/d/')[1].split('/')[0];
    }
    try {
      ss = SpreadsheetApp.openById(sheetId);
    } catch (e) {
      Logger.log("Error opening spreadsheet by ID: " + e.message);
    }
  }
  
  if (!ss) {
    throw new Error(
      "Spreadsheet not found! If running standalone from script.google.com, please paste your Google Sheet URL into the SPREADSHEET_ID_OR_URL variable at line 11 of Code.gs."
    );
  }
  return ss;
}

/**
 * Main synchronization function.
 * Synchronizes responses from 'Original form' to 'Website' sheet,
 * filtering out email addresses and preserving administrative 'Developer Reply' entries.
 */
function syncFormResponsesToWebsite() {
  const ss = getTargetSpreadsheet();
  
  // 1. Locate or create Master Sheet ('Original form')
  let masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) {
    // Fallback to first form responses sheet if 'Original form' is default 'Form Responses 1'
    const sheets = ss.getSheets();
    masterSheet = sheets.find(s => s.getName().startsWith('Form Responses')) || sheets[0];
  }
  
  if (!masterSheet) {
    Logger.log("Error: Could not locate master response sheet.");
    return;
  }
  
  // 2. Locate or create Public Secondary Sheet ('Website')
  let publicSheet = ss.getSheetByName(PUBLIC_SHEET_NAME);
  if (!publicSheet) {
    publicSheet = ss.insertSheet(PUBLIC_SHEET_NAME);
  }
  
  // 3. Fetch Master Data
  const masterData = masterSheet.getDataRange().getValues();
  if (masterData.length <= 1) {
    // Only headers or empty sheet
    setupPublicSheetHeaders(publicSheet);
    return;
  }
  
  // 4. Fetch existing 'Website' Sheet Data to preserve administrative replies
  let existingRepliesMap = new Map();
  if (publicSheet.getLastRow() > 1) {
    const publicData = publicSheet.getDataRange().getValues();
    // Headers are in row 0 (index 0). Data starts from row 1.
    for (let i = 1; i < publicData.length; i++) {
      const row = publicData[i];
      const timestamp = String(row[0]);
      const reply = row[4] ? String(row[4]) : ''; // Column E is Developer Reply
      if (timestamp && reply) {
        existingRepliesMap.set(timestamp, reply);
      }
    }
  }
  
  // 5. Build Sanitized Public Dataset
  // Expected Master Columns: [A: Timestamp, B: Email Address, C: Name, D: Rating, E: Review, ...]
  // Target Public Columns:   [A: Timestamp, B: Name, C: Rating, D: Review, E: Developer Reply]
  
  const publicRows = [
    ["Timestamp", "Username", "Rating", "Review", "Developer Reply"] // Headers
  ];
  
  for (let i = 1; i < masterData.length; i++) {
    const masterRow = masterData[i];
    const timestamp = masterRow[0] ? String(masterRow[0]) : '';
    const email = masterRow[1]; // SENSITIVE: FILTERED OUT!
    const username = masterRow[2] || masterRow[1] || 'Anonymous Petal User';
    const rating = masterRow[3] || 5;
    const review = masterRow[4] || '';
    
    // Preserve administrative reply if present
    const existingReply = existingRepliesMap.get(timestamp) || '';
    
    publicRows.push([
      timestamp,
      username,
      rating,
      review,
      existingReply
    ]);
  }
  
  // 6. Write to 'Website' Sheet
  publicSheet.clearContents();
  publicSheet.getRange(1, 1, publicRows.length, 5).setValues(publicRows);
  
  // Format Headers
  publicSheet.getRange("A1:E1")
    .setFontWeight("bold")
    .setBackground("#6750A4")
    .setFontColor("#FFFFFF");
  
  // Auto-fit column widths
  publicSheet.autoResizeColumns(1, 5);
  Logger.log(`Successfully synchronized ${publicRows.length - 1} reviews to 'Website' sheet.`);
}

/**
 * Sets up column headers for public sheet if empty.
 */
function setupPublicSheetHeaders(sheet) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 5).setValues([
    ["Timestamp", "Username", "Rating", "Review", "Developer Reply"]
  ]);
  sheet.getRange("A1:E1")
    .setFontWeight("bold")
    .setBackground("#6750A4")
    .setFontColor("#FFFFFF");
}

/**
 * Automatic Trigger Setup Helper.
 * Run this function once in Apps Script to automatically install an 'onFormSubmit' trigger.
 */
function setupAutoSyncTrigger() {
  const ss = getTargetSpreadsheet();
  
  // Check if trigger already exists
  const existingTriggers = ScriptApp.getUserTriggers(ss);
  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === 'syncFormResponsesToWebsite') {
      Logger.log("Trigger already exists.");
      return;
    }
  }
  
  // Create Form Submit Trigger
  ScriptApp.newTrigger('syncFormResponsesToWebsite')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
    
  Logger.log("Successfully created automated onFormSubmit trigger for 'syncFormResponsesToWebsite'.");
}
