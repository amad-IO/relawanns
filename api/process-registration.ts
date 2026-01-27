import { google } from 'googleapis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // "Fire and Forget" strategy:
    // We start processing but might return response early if Vercel allowed it easily.
    // But since Vercel functions kill process after response, we must await.
    // Optimization: Use Promise.all to run Drive, Sheet, Telegram in parallel.

    try {
        const { registrationData, files, folderId } = req.body;
        // registrationData: { name, email, phone, age, city, ... }
        // files: [{ url, name }, ...]

        console.log('=== BACKEND FUNCTION CALLED ===');
        console.log('Processing registration for:', registrationData?.name);
        console.log('Files to sync:', files?.length || 0);
        console.log('Payload received:', JSON.stringify({ registrationData, filesCount: files?.length }));

        // 1. Setup Credentials
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const telegramToken = process.env.BOT_RELAWANNS_TOKEN;
        const chatId = process.env.NOTIFICATION_CHAT_ID;

        // Basic validation
        console.log('Environment check:', {
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey,
            hasSpreadsheetId: !!spreadsheetId,
            hasFolderId: !!targetFolderId,
            hasTelegramToken: !!telegramToken,
            hasChatId: !!chatId
        });

        if (!clientEmail || !privateKey) {
            console.error('Missing Google Credentials');
            return res.status(500).json({ success: false, message: 'Server config error (Google)' });
        }

        // Auth Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/spreadsheets'
            ],
        });

        const drive = google.drive({ version: 'v3', auth });
        const sheets = google.sheets({ version: 'v4', auth });

        // TASKS LIST
        const tasks: Promise<any>[] = [];

        // ---------------------------------------------------------
        // TASK A: Upload to Google Drive
        // ---------------------------------------------------------
        const driveTask = async () => {
            if (!targetFolderId || !files || files.length === 0) return null;
            const uploadResults = [];

            for (const file of files) {
                if (!file.url) continue;
                try {
                    const response = await fetch(file.url);
                    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

                    const driveRes = await drive.files.create({
                        requestBody: {
                            name: file.name,
                            parents: [targetFolderId],
                        },
                        media: {
                            mimeType: response.headers.get('content-type') || 'application/octet-stream',
                            body: response.body as any,
                        },
                        fields: 'id, webViewLink',
                    });
                    uploadResults.push({ name: file.name, link: driveRes.data.webViewLink });
                } catch (e) {
                    console.error('Drive upload failed for ' + file.name, e);
                }
            }
            return uploadResults;
        };
        tasks.push(driveTask());

        // ---------------------------------------------------------
        // TASK B: Insert into Google Sheet
        // ---------------------------------------------------------
        const sheetTask = async () => {
            if (!spreadsheetId || !registrationData) return null;
            try {
                // Prepare row data: Name, Email, Phone, Age, City, IG, History, Vest, PaymentURL, TikTokURL, IGURL, Timestamp
                const values = [[
                    registrationData.name,
                    registrationData.email,
                    registrationData.phone,
                    registrationData.age,
                    registrationData.city,
                    registrationData.instagramUsername,
                    registrationData.participationHistory ? 'Pernah' : 'Belum',
                    registrationData.vestSize,
                    registrationData.fileUrls?.paymentProof || '',
                    registrationData.fileUrls?.tiktokProof || '',
                    registrationData.fileUrls?.instagramProof || '',
                    new Date().toISOString()
                ]];

                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Sheet1!A:L', // Adjust Sheet name if different
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values },
                });
                return 'Sheet Inserted';
            } catch (e) {
                console.error('Sheet insert failed', e);
                return null;
            }
        };
        tasks.push(sheetTask());

        // ---------------------------------------------------------
        // TASK C: Telegram Notification
        // ---------------------------------------------------------
        const telegramTask = async () => {
            if (!telegramToken || !chatId || !registrationData) return null;
            try {
                const message = `
🤖 **Pendaftaran Relawan Baru!**

👤 **Nama:** ${registrationData.name}
📱 **No HP:** ${registrationData.phone}
📧 **Email:** ${registrationData.email}
📍 **Domisili:** ${registrationData.city}
👕 **Ukuran Rompi:** ${registrationData.vestSize}

Cek detail lengkap di Dashboard / Google Sheet.
`;
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });
                return 'Telegram Sent';
            } catch (e) {
                console.error('Telegram failed', e);
                return null;
            }
        };
        tasks.push(telegramTask());

        // EXECUTE ALL IN PARALLEL
        console.log('Executing', tasks.length, 'parallel tasks...');
        const results = await Promise.all(tasks);
        console.log('All tasks completed:', results);

        return res.status(200).json({ success: true, message: 'All backend tasks processed', results });

    } catch (error: any) {
        console.error('Process error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
