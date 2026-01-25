// Google Workspace API Utilities
// Handles authentication and operations for Google Sheets and Google Drive

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

/**
 * Get authenticated Google API client
 * Uses service account credentials from credentials.json or environment variable
 */
function getGoogleAuth() {
  try {
    let credentials;

    // Try to read from environment variable first (for production)
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } else {
      // Read from local file (for development)
      const credPath = path.resolve(__dirname, '../../credentials.json');
      credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    return auth;
  } catch (error) {
    console.error('Failed to authenticate with Google:', error);
    throw new Error('Google authentication failed');
  }
}

/**
 * Find or create a sheet (tab) by name in the spreadsheet
 * @param {string} sheetName - Name of the sheet to find or create
 * @returns {Promise<number>} Sheet ID
 */
async function getOrCreateSheet(sheetName) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all sheets in the spreadsheet
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    // Check if sheet already exists
    const existingSheet = metadata.data.sheets.find(
      (sheet) => sheet.properties.title === sheetName
    );

    if (existingSheet) {
      console.log(`Sheet "${sheetName}" already exists`);
      return existingSheet.properties.sheetId;
    }

    // Create new sheet
    console.log(`Creating new sheet: "${sheetName}"`);
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    const newSheetId = response.data.replies[0].addSheet.properties.sheetId;

    // Add header row
    const headerRow = [
      'No',
      'Nama',
      'Email',
      'No WA',
      'Usia',
      'Domisili',
      'Instagram',
      'Pernah ikut relawanns?',
      'Ukuran Vest',
      'Link Bukti Bayar',
      'Screenshot TikTok',
      'Screenshot IG',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headerRow],
      },
    });

    console.log(`Header row added to sheet "${sheetName}"`);
    return newSheetId;
  } catch (error) {
    console.error('Error in getOrCreateSheet:', error);
    throw error;
  }
}

/**
 * Append a row of data to a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} rowData - Array of values for the row
 */
async function appendToSheet(sheetName, rowData) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get current row count to calculate row number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
    });

    const rowCount = response.data.values ? response.data.values.length : 0;
    const rowNumber = rowCount; // Header is row 1, so this is the next available row

    // Prepend row number to data
    const dataWithNumber = [rowNumber, ...rowData];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowCount + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [dataWithNumber],
      },
    });

    console.log(`Data appended to sheet "${sheetName}"`);
  } catch (error) {
    console.error('Error in appendToSheet:', error);
    throw error;
  }
}

/**
 * Upload a file to Google Drive
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name for the file
 * @param {string} mimeType - MIME type of the file
 * @param {string} parentFolderId - Parent folder ID (optional)
 * @returns {Promise<string>} Shareable link to the file
 */
async function uploadToDrive(fileBuffer, fileName, mimeType, parentFolderId = null) {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : [],
    };

    const media = {
      mimeType: mimeType,
      body: require('stream').Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id;

    // Make the file accessible to anyone with the link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`File uploaded: ${fileName} (${fileId})`);
    return response.data.webViewLink;
  } catch (error) {
    console.error('Error in uploadToDrive:', error);
    throw error;
  }
}

/**
 * Find or create a folder in Google Drive
 * @param {string} folderName - Name of the folder
 * @param {string} parentFolderId - Parent folder ID
 * @returns {Promise<string>} Folder ID
 */
async function getOrCreateFolder(folderName, parentFolderId = DRIVE_FOLDER_ID) {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    // Search for existing folder
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files.length > 0) {
      console.log(`Folder "${folderName}" already exists`);
      return response.data.files[0].id;
    }

    // Create new folder
    console.log(`Creating new folder: "${folderName}"`);
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error in getOrCreateFolder:', error);
    throw error;
  }
}

module.exports = {
  getOrCreateSheet,
  appendToSheet,
  uploadToDrive,
  getOrCreateFolder,
};
