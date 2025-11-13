// src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ✅ Import main routes and services
const apiRoutes = require('./routes/api');
const { createWhatsAppClient } = require('./lib/sessionManager');

// ✅ Import Redis Queue and Bull Board (Monitoring UI)
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const messageQueue = require('./lib/queue');

const app = express();
app.use(express.json());

// ✅ Bull Dashboard Setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queue');

createBullBoard({
  queues: [new BullAdapter(messageQueue)],
  serverAdapter,
});

// ✅ Environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-engine-db';

// ----------------------------------
// ✅ MongoDB Connection
// ----------------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ----------------------------------
// ✅ Root Landing Page
// ----------------------------------
app.get('/', (req, res) => {
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

// ----------------------------------
// ✅ Attach API Routes and Queue Dashboard
// ----------------------------------
app.use('/api', apiRoutes);
app.use('/queue', serverAdapter.getRouter());

// ----------------------------------
// ✅ QR Page (Permanent Session Login)
// ----------------------------------
app.get('/generate-qr', async (req, res) => {
  const sessionId = 'main-session'; // Fixed session ID for single-user setup
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

// ----------------------------------
// ✅ Restore Session on Server Restart
// ----------------------------------
(async () => {
  const authPath = path.join(__dirname, '../data/.wwebjs_auth');
  const mainSession = 'session-main-session';

  if (fs.existsSync(`${authPath}/${mainSession}`)) {
    console.log(`♻️ Restoring main session: ${mainSession}`);
    await createWhatsAppClient('main-session');
  } else {
    console.log('⚠️ No saved session found. Please generate QR and log in once.');
  }
})();

// ----------------------------------
// ✅ Start Express Server
// ----------------------------------
app.listen(PORT, () => {
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📊 Queue dashboard:  http://localhost:${PORT}/queue`);
});
