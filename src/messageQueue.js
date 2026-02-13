// src/messageQueue.js
const Queue = require('bull');
const { getClient } = require('./lib/sessionManager');
const Message = require('./models/Message');

// Create a Redis-backed Bull queue
const messageQueue = new Queue('whatsapp-messages', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

// Worker: Handles queued WhatsApp messages
messageQueue.process(async (job) => {
  const { sessionId, to, body } = job.data;
  console.log(`📨 Processing message for ${to} (Session: ${sessionId})`);

  try {
    const client = getClient(sessionId);

    if (!client) {
      throw new Error(`Session ${sessionId} not found or not ready.`);
    }

    // Format phone number correctly for WhatsApp Web
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    // Send the message through the WhatsApp client
    const sentMsg = await client.sendMessage(chatId, body);

    // Save message log in MongoDB
    await Message.create({
      sessionId,
      to,
      body,
      status: 'SENT',
      sentAt: new Date(),
    });

    console.log(`✅ Message sent successfully to ${to}`);
    return sentMsg.id.id;
  } catch (error) {
    console.error(`❌ Failed to send message to ${to}: ${error.message}`);

    // Log failure in MongoDB
    await Message.create({
      sessionId,
      to,
      body,
      status: 'FAILED',
      error: error.message,
      sentAt: new Date(),
    });

    // Re-throw for Bull retry mechanism
    throw error;
  }
});


// Bull Event Logging (Debug + Monitoring)
// Job succeeded
messageQueue.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed successfully for ${job.data.to}`);
});

// Job failed
messageQueue.on('failed', (job, err) => {
  console.error(`⚠️ Job ${job.id} failed for ${job.data.to}: ${err.message}`);
});

// Job waiting
messageQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting in the queue.`);
});

// Job stalled (retrying)
messageQueue.on('stalled', (job) => {
  console.warn(`🚨 Job ${job.id} stalled. Retrying automatically...`);
});

module.exports = messageQueue;
