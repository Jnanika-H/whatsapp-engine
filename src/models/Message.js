// src/models/Message.js
const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores all WhatsApp messages processed by the engine,
 * including queued, sent, delivered, and failed messages.
 */
const MessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      comment: 'Unique ID for the WhatsApp session used to send this message.',
    },

    to: {
      type: String,
      required: true,
      trim: true,
      comment: 'Recipient phone number (with country code).',
    },

    body: {
      type: String,
      required: true,
      trim: true,
      comment: 'Actual text content of the message sent to the user.',
    },

    status: {
      type: String,
      enum: ['QUEUED', 'SENT', 'DELIVERED', 'FAILED'],
      default: 'QUEUED',
      comment: 'Current delivery state of the message.',
    },

    sentAt: {
      type: Date,
      default: null,
      comment: 'Timestamp when the message was successfully sent.',
    },

    error: {
      type: String,
      default: null,
      trim: true,
      comment: 'Error message in case of failure.',
    },
  },
  {
    timestamps: true, // ✅ Automatically adds createdAt and updatedAt fields
    versionKey: false,
  }
);

// ✅ Compound index for faster lookups by session and recency
MessageSchema.index({ sessionId: 1, createdAt: -1 });

// ✅ Virtual: format message data for API responses
MessageSchema.virtual('summary').get(function () {
  return {
    id: this._id,
    to: this.to,
    body: this.body,
    status: this.status,
    sentAt: this.sentAt,
    createdAt: this.createdAt,
    error: this.error,
  };
});

module.exports = mongoose.model('Message', MessageSchema);
