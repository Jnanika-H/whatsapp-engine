// src/lib/queue.js
const Queue = require('bull');
const { getClient } = require('./sessionManager');
const Message = require('../models/Message');

// Single queue name used across the app
const messageQueue = new Queue('message-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

// Worker
messageQueue.process(async (job) => {
  const { sessionId, to, message } = job.data;
  console.log(`📩 Processing message for ${to} (Session: ${sessionId})`);

  try {
    const client = getClient(sessionId);

    if (!client) {
      throw new Error(`Session ${sessionId} not found or not ready.`);
    }

    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    const sentMsg = await client.sendMessage(chatId, message);

    await Message.create({
      sessionId,
      to,
      body: message,
      status: 'SENT',
      sentAt: new Date(),
    });

    console.log(`✅ Message sent successfully to ${to}`);
    return { success: true, messageId: sentMsg.id?.id || null };
  } catch (error) {
    console.error(`❌ Message send failed for ${to}: ${error.message}`);

    await Message.create({
      sessionId,
      to,
      body: message,
      status: 'FAILED',
      error: error.message,
      sentAt: new Date(),
    });

    throw error;
  }
});

// Event logging
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

module.exports = messageQueue;
