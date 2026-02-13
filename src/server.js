// src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const session = require('express-session');
const loginAuth = require('./middleware/loginAuth');

const apiRoutes = require('./routes/api');
const { createWhatsAppClient, destroySession } = require('./lib/sessionManager');

const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const messageQueue = require('./lib/queue');

const app = express();
app.use(express.json());

app.use(session({
  secret: 'whatsapp-engine-secret',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, 'public')));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queue');

createBullBoard({
  queues: [new BullAdapter(messageQueue)],
  serverAdapter,
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-engine-db';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

  // ===== LOGIN ROUTES (ADDED) =====
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;

  if (user === 'admin' && pass === 'admin') {
    req.session.isLoggedIn = true;
    return res.sendStatus(200);
  }

  res.sendStatus(401);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});
// ===== END LOGIN ROUTES =====


app.get('/', loginAuth, (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Communication Engine</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f9f9f9;
          }
          h1 { color: #075E54; }
          p { color: #444; }
          button {
            margin-top: 20px;
            padding: 10px 15px;
            font-size: 16px;
            background-color: #25D366;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          button:hover {
            background-color: #128C7E;
          }
          a {
            margin-top: 15px;
            color: #128C7E;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <h1>🚀 WhatsApp Communication Engine</h1>
        <p>Click below to generate or restore your WhatsApp QR session</p>
        <button onclick="window.location.href='/generate-qr'">Generate QR</button>
        <a href="/queue" target="_blank">📊 Open Queue Dashboard</a>
      </body>
    </html>
  `);
});

app.use('/api', apiRoutes);
app.use('/queue', serverAdapter.getRouter());

app.get('/generate-qr', loginAuth, async (req, res) => {
  const sessionId = 'main-session';
  await createWhatsAppClient(sessionId);
  res.send(`
    <html>
      <head>
        <title>Scan WhatsApp QR</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            background: #f7fdf9;
            margin-top: 70px;
          }
          h2 { color: #128C7E; }
          img {
            border: 5px solid #25D366;
            border-radius: 15px;
            padding: 5px;
            margin-top: 20px;
          }
          button {
            background: #25D366;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
          }
          button:hover { background: #1EBE5B; }
          .loading { color: #888; margin-top: 10px; }
          #success { font-size: 22px; color: #128C7E; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>📱 Scan this QR using WhatsApp</h2>
        <div id="qr-container"><p class="loading">Loading QR...</p></div>
        <div id="success" style="display:none;">✅ Logged in successfully!</div>
        <br/>
        <p>Session ID: <b>${sessionId}</b></p>
        <button onclick="window.location='/'">🏠 Back Home</button>
        <button onclick="logout()">🚪 Logout</button>

        <script>
          const sessionId = "${sessionId}";
          const qrContainer = document.getElementById('qr-container');
          const successDiv = document.getElementById('success');

          async function fetchQR() {
            const res = await fetch('/api/qr/' + sessionId);
            const data = await res.json();
            if (data.qr) qrContainer.innerHTML = '<img src="' + data.qr + '" width="300"/>';
            else qrContainer.innerHTML = '<p class="loading">QR not ready yet. Please wait...</p>';
          }

          async function checkStatus() {
            const res = await fetch('/api/status/' + sessionId);
            const data = await res.json();
            if (data.status === 'ready') {
              qrContainer.innerHTML = '';
              successDiv.style.display = 'block';
            } else if (data.status === 'pending') {
              await fetchQR();
            }
          }

          async function logout() {
            await fetch('/api/logout/' + sessionId, { method: 'POST' });
            alert('✅ Logged out successfully!');
            window.location.href = '/';
          }

          setInterval(checkStatus, 4000);
          fetchQR();
        </script>
      </body>
    </html>
  `);
});


//RESTORE LOGIC
(async () => {
  try {
    const authPath = path.join(__dirname, '../data/.wwebjs_auth');
    const folder = path.join(authPath, 'session-main-session');
    const flag = path.join(folder, 'delete.flag');

    // Delete folder if it was marked for deletion (manual/mobile logout)
    if (fs.existsSync(flag)) {
      console.log("🧹 Deleting logout-marked session folder...");
      try {
        fs.rmSync(folder, { recursive: true, force: true });
      } catch (e) {
        console.log("⚠️ Failed to delete:", e.message);
      }
    }

    // After cleanup -> restore or ask for login
    if (fs.existsSync(folder)) {
      console.log(`♻️ Restoring main session: main-session`);
      await createWhatsAppClient('main-session');
      console.log("✅ Session restored successfully.");
    } else {
      console.log("⚠️ No saved session found. Please generate QR and log in once.");
    }

  } catch (err) {
    console.error('❌ Error while restoring session:', err);
  }
})();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 Queue dashboard:  http://localhost:${PORT}/queue`);
});

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Shutting down gracefully...');
  try { await destroySession('main-session'); } catch {}
  try { await mongoose.disconnect(); } catch {}
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
