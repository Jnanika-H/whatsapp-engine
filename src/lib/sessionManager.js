// src/lib/sessionManager.js
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const UserSession = require('../models/UserSession'); // For DB sync if you store session info

const sessions = new Map();

// ✅ Detect Chrome installation path
function getChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of possiblePaths) {
    try {
      fs.accessSync(p);
      console.log(`✅ Using Chrome from: ${p}`);
      return p;
    } catch (_) {}
  }

  console.warn('⚠️ Chrome not found. Falling back to Puppeteer default.');
  return undefined;
}

// 🧹 Safe folder deletion (Windows-friendly)
function safeDeleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true, maxRetries: 5 });
      console.log(`🗑️ Deleted folder: ${folderPath}`);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        console.warn(`⚠️ Folder locked: ${folderPath}. Retrying in 2s...`);
        setTimeout(() => {
          try {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`✅ Retried and cleaned: ${folderPath}`);
          } catch {
            console.warn(`⚠️ Still locked, skipping cleanup for: ${folderPath}`);
          }
        }, 2000);
      } else {
        console.error(`❌ Error deleting folder ${folderPath}:`, err.message);
      }
    }
  }
}

// 🚀 Create or restore a WhatsApp session
async function createWhatsAppClient(sessionId) {
  console.log(`🚀 Initializing WhatsApp client for session: ${sessionId}`);

  // ✅ Use centralized data folder for auth & cache
  const baseDataPath = path.join(__dirname, '../../data');
  const authPath = path.join(baseDataPath, '.wwebjs_auth');
  const cachePath = path.join(baseDataPath, '.wwebjs_cache');

  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

  const client = new Client({
    puppeteer: {
      headless: true,
      executablePath: getChromePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-infobars',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--window-size=1280,800',
      ],
    },
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: authPath, // ✅ stores login data persistently
    }),
    webVersionCache: {
      path: cachePath, // ✅ stores cached WA web files
      build: 'latest',
    },
  });

  // Store temporary session info
  sessions.set(sessionId, { client, qr: null, ready: false });

  // 📱 When QR is generated
  client.on('qr', async (qr) => {
    console.log(`📱 New QR generated for session: ${sessionId}`);
    const qrImage = await qrcode.toDataURL(qr);
    sessions.set(sessionId, { client, qr: qrImage, ready: false });
  });

  // 🔐 When authenticated
  client.on('authenticated', async () => {
    console.log(`🔐 Authenticated for session: ${sessionId}`);
    await UserSession.updateOne(
      { sessionId },
      { $set: { status: 'ready', isAuthenticated: true } },
      { upsert: true }
    );
  });

  // 💬 When client is ready
  client.on('ready', () => {
    console.log(`💬 WhatsApp ready for session: ${sessionId}`);
    const session = sessions.get(sessionId);
    if (session) {
      session.ready = true;
      sessions.set(sessionId, session);
    }
  });

  // ⚠️ Handle disconnection or manual logout
  client.on('disconnected', async (reason) => {
    console.log(`⚠️ Disconnected (${sessionId}): ${reason}`);

    const sessionFolder = path.join(authPath, `session-${sessionId}`);
    safeDeleteFolder(sessionFolder); // ✅ safe, no crash even if locked

    await UserSession.updateOne(
      { sessionId },
      { $set: { status: 'disconnected', isAuthenticated: false } }
    );

    sessions.delete(sessionId);
  });

  // 🧠 Initialize client with recovery handling
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await client.initialize();
  } catch (err) {
    console.error(`❌ Failed to initialize session ${sessionId}:`, err.message);

    if (
      err.message.includes('Session closed') ||
      err.message.includes('Protocol error')
    ) {
      console.log(`🧩 Invalid session detected. Cleaning up ${sessionId}...`);
      const sessionFolder = path.join(authPath, `session-${sessionId}`);
      safeDeleteFolder(sessionFolder);
      console.log('🧹 Old session deleted. Restarting WhatsApp client...');
      return await createWhatsAppClient(sessionId);
    }
  }

  return client;
}

// 🔹 Get QR for session
function getQR(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.qr : null;
}

// 🔹 Get session status
function getSessionStatus(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return 'not_found';
  return session.ready ? 'ready' : 'pending';
}

// 🔹 Get client instance
function getClient(sessionId) {
  const session = sessions.get(sessionId);
  return session?.client || null;
}

module.exports = {
  createWhatsAppClient,
  getQR,
  getSessionStatus,
  getClient,
};
