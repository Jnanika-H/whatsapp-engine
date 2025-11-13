// src/routes/api.js
const express = require('express');
const {
  createWhatsAppClient,
  getQR,
  getSessionStatus,
  getClient,
} = require('../lib/sessionManager');
const Message = require('../models/Message');
const messageQueue = require('../lib/queue');

const router = express.Router();

// -------------------------------------
// 🔹 POST /api/login → Initialize WhatsApp Session
// -------------------------------------
router.post('/login', async (req, res) => {
  try {
    const sessionId = 'main-session'; // ✅ Permanent session ID
    await createWhatsAppClient(sessionId);
    res.json({
      sessionId,
      message: 'Session initialized. Scan QR code to login (only once).',
    });
  } catch (error) {
    console.error('❌ Error initializing WhatsApp session:', error);
    res.status(500).json({ error: 'Failed to initialize WhatsApp session.' });
  }
});

// -------------------------------------
// 🔹 GET /api/qr/:sessionId → Get QR Code
// -------------------------------------
router.get('/qr/:sessionId', async (req, res) => {
  const qr = getQR(req.params.sessionId);
  if (!qr) {
    return res.status(404).json({ error: 'QR not generated yet. Please wait...' });
  }
  res.json({ sessionId: req.params.sessionId, qr });
});

// -------------------------------------
// 🔹 GET /api/status/:sessionId → Check Session Status
// -------------------------------------
router.get('/status/:sessionId', async (req, res) => {
  const status = getSessionStatus(req.params.sessionId);
  res.json({ sessionId: req.params.sessionId, status });
});

// -------------------------------------
// 🔹 POST /api/send-message → Queue WhatsApp Message
// -------------------------------------
router.post('/send-message', async (req, res) => {
  const { to, message } = req.body;
  const sessionId = 'main-session'; // ✅ Use main session by default

  if (!to || !message) {
    return res.status(400).json({ error: 'Both "to" and "message" fields are required.' });
  }

  try {
    await messageQueue.add({ sessionId, to, message });
    console.log(`📥 Message queued for ${to}`);
    res.json({ status: 'queued', to, message });
  } catch (error) {
    console.error('❌ Error adding message to queue:', error);
    res.status(500).json({ error: 'Failed to queue message.' });
  }
});

// -------------------------------------
// 🔹 GET /api/message-status/:to → Check Message Delivery Status
// -------------------------------------
router.get('/message-status/:to', async (req, res) => {
  const { to } = req.params;

  try {
    const message = await Message.findOne({ to }).sort({ createdAt: -1 });

    if (!message) {
      return res.status(404).json({ to, status: 'not_found', message: 'No message record found.' });
    }

    res.json({
      to: message.to,
      status: message.status,
      body: message.body,
      sentAt: message.sentAt,
      error: message.error || null,
    });
  } catch (error) {
    console.error('❌ Error retrieving message status:', error);
    res.status(500).json({ error: 'Failed to fetch message status.' });
  }
});

// -------------------------------------
// 🔹 POST /api/logout → Logout and Destroy Session
// -------------------------------------
router.post('/logout', async (req, res) => {
  const sessionId = 'main-session';

  try {
    const session = getClient(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'No active session found to logout.' });
    }

    await session.destroy();
    console.log('🚪 Logged out main session successfully.');
    res.json({ status: 'logged_out', sessionId });
  } catch (error) {
    console.error('❌ Error logging out session:', error);
    res.status(500).json({ error: 'Failed to logout session.' });
  }
});

module.exports = router;
