// src/lib/sessionManager.js
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const UserSession = require('../models/UserSession');

//LocalAuth.logout() from deleting files (avoids EBUSY error)
LocalAuth.prototype.logout = async function () {
  console.log("⚠️ LocalAuth.logout() prevented (avoiding EBUSY crash).");
  return; // Do nothing, skip deletion
};

const sessions = new Map();

// Helper delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Safe delete folder AFTER delay to avoid EBUSY
async function delayedDeleteFolder(folderPath, delay = 5000) {
  console.log(`🕒 Waiting ${delay}ms before deleting locked session folder...`);
  await sleep(delay);

  try {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`🗑️ Session folder deleted successfully: ${folderPath}`);
  } catch (error) {
    console.warn(`⚠️ Delayed delete failed: ${error.message}`);
  }
}

// Chrome finder
function getChromePath() {
  const envPath = process.env.CHROME_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of paths) if (fs.existsSync(p)) return p;

  return undefined;
}

// Paths
const BASE_DATA = path.join(__dirname, '../../data');
const AUTH_DIR = path.join(BASE_DATA, '.wwebjs_auth');
const CACHE_DIR = path.join(BASE_DATA, '.wwebjs_cache');

// MAIN FUNCTION
async function createWhatsAppClient(sessionId = 'main-session') {
  if (sessions.has(sessionId)) {
    const s = sessions.get(sessionId);
    if (s.client) return s.client;
  }

  console.log(`🚀 Starting client for: ${sessionId}`);

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const client = new Client({
    puppeteer: {
      headless: 'new',
      executablePath: getChromePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors'
      ]
    },
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: AUTH_DIR,
      cleanup: false
    }),
    webVersionCache: {
      path: CACHE_DIR,
      build: 'latest'
    }
  });

  sessions.set(sessionId, { client, ready: false, qr: null });

  // QR EVENT
  client.on('qr', async qr => {
    const qrImg = await qrcode.toDataURL(qr);
    sessions.get(sessionId).qr = qrImg;

    await UserSession.updateOne(
      { sessionId },
      { $set: { status: 'PENDING' } },
      { upsert: true }
    );

    console.log(`📱 QR generated.`);
  });

  // AUTH EVENT
  client.on('authenticated', async () => {
    console.log(`🔐 Authenticated.`);
  });

  // READY EVENT
  client.on('ready', async () => {
    console.log(`💬 WhatsApp ready.`);
    const s = sessions.get(sessionId);
    s.ready = true;
    s.qr = null;

    await UserSession.updateOne(
      { sessionId },
      { $set: { status: 'READY', isAuthenticated: true } },
      { upsert: true }
    );
  });

  // DISCONNECT EVENT 
  client.on('disconnected', async reason => {
    console.log(`⚠️ Disconnected Reason = ${reason}`);

    const folder = path.join(AUTH_DIR, `session-${sessionId}`);
    const deleteFlag = path.join(folder, "delete.flag");

    if (String(reason).toUpperCase() === 'LOGOUT') {
      console.log("📴 Mobile logout detected → marking folder for deletion on next restart.");

      // Mark delete flag instead of deleting now → FIX FOR EBUSY
      try {
        fs.writeFileSync(deleteFlag, "delete");
      } catch (e) {
        console.warn("⚠️ Failed to write delete flag:", e.message);
      }

      await UserSession.deleteOne({ sessionId });
      sessions.delete(sessionId);

      console.log("✅ SESSION LOGGED OUT (folder will delete on restart).");
      return;
    }

    // Normal disconnect (Chrome closed)
    sessions.delete(sessionId);
  });

  // Initialize client
  await client.initialize();
  return client;
}

// destroySession() — manual API logout
async function destroySession(sessionId = 'main-session') {
  const s = sessions.get(sessionId);
  try {
    if (s?.client?.destroy) {
      await s.client.destroy();
    }
  } catch (err) {
    console.warn(`⚠️ Ignoring destroy error: ${err.message}`);
  }

  console.log(`🗑️ Cleaning up session files for ${sessionId}...`);

  const folder = path.join(AUTH_DIR, `session-${sessionId}`);
  const deleteFlag = path.join(folder, "delete.flag");

  try {
    fs.writeFileSync(deleteFlag, "delete");
  } catch {}

  await UserSession.updateOne(
    { sessionId },
    { $set: { status: 'DISCONNECTED', isAuthenticated: false } }
  );

  sessions.delete(sessionId);

  console.log(`🚪 Session ${sessionId} cleaned safely (folder deletion on restart).`);
}

// SIMPLE GETTERS
function getQR(id) {
  return sessions.get(id)?.qr || null;
}

function getSessionStatus(id) {
  const s = sessions.get(id);
  return s?.ready ? 'ready' : s ? 'pending' : 'not_found';
}

function getClient(id) {
  return sessions.get(id)?.client || null;
}

module.exports = {
  createWhatsAppClient,
  getQR,
  getSessionStatus,
  getClient,
  destroySession
};