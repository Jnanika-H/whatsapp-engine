// src/lib/queue.js
const Queue = require('bull');
const { getClient } = require('./sessionManager');
const Message = require('../models/Message');

// ✅ Create Redis-backed Bull queue for WhatsApp messages
const messageQueue = new Queue('message-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

// 🧠 Worker: Process messages one by one
messageQueue.process(async (job) => {
  const { sessionId, to, message } = job.data;
  console.log(`📩 Processing message for ${to} (Session: ${sessionId})`);

  try {
    const client = getClient(sessionId);

    if (!client) {
      throw new Error(`Session ${sessionId} not found or not ready.`);
    }

    // ✅ Format phone number correctly for WhatsApp
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    // ✅ Send message via WhatsApp Web.js
    const sentMsg = await client.sendMessage(chatId, message);

    // ✅ Log success in MongoDB
    await Message.create({
      sessionId,
      to,
      body: message,
      status: 'SENT',
      sentAt: new Date(),
    });

    console.log(`✅ Message sent successfully to ${to}`);
    return { success: true, messageId: sentMsg.id.id };
  } catch (error) {
    console.error(`❌ Message send failed for ${to}: ${error.message}`);

    // Log failure in MongoDB
    await Message.create({
      sessionId,
      to,
      body: message,
      status: 'FAILED',
      error: error.message,
      sentAt: new Date(),
    });

    // Throw error to allow Bull retries
    throw error;
  }
});

// ----------------------------------
// 🧾 Event Logging for Monitoring
// ----------------------------------
messageQueue.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed successfully for ${job.data.to}`);
});

messageQueue.on('failed', (job, err) => {
  console.error(`⚠️ Job ${job.id} failed for ${job.data.to}: ${err.message}`);
});

messageQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting to be processed.`);
});

messageQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled. Will retry automatically.`);
});

// ----------------------------------
// ✅ Export Queue for use in server.js and worker.js
// ----------------------------------
module.exports = messageQueue;
