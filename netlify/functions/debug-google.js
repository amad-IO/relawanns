// Debug endpoint to test Google Workspace connection
const { getOrCreateSheet, appendToSheet, getOrCreateFolder } = require('./utils/google');

exports.handler = async function (event, context) {
  try {
    // Check environment variables
    const envCheck = {
      GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      GOOGLE_CREDENTIALS_JSON: !!process.env.GOOGLE_CREDENTIALS_JSON,
    };

    console.log('Environment variables check:', envCheck);

    if (!process.env.GOOGLE_SPREADSHEET_ID || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing environment variables',
          details: envCheck
        })
      };
    }

    // Test creating a sheet
    const testSheetName = 'Debug Test - ' + new Date().toISOString();
    await getOrCreateSheet(testSheetName);

    // Test creating a folder
    const testFolderName = 'Debug Test - ' + new Date().toISOString();
    const folderId = await getOrCreateFolder(testFolderName);

    // Test appending data
    await appendToSheet(testSheetName, ['Test', 'test@email.com', '081234567890', '25', 'Jakarta', '@testuser', 'Belum Pernah', 'L', 'https://test.com', 'https://test.com', 'https://test.com']);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Google Workspace integration working!',
        envCheck,
        testSheetName,
        testFolderName,
        folderId
      })
    };

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
