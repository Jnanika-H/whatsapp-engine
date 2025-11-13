// src/models/UserSession.js
const mongoose = require('mongoose');

/**
 * UserSession Schema
 * Tracks each WhatsApp Web session handled by the engine.
 * Includes authentication state, connection status, and storage paths.
 */
const UserSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      comment: 'Unique ID for the WhatsApp session.',
    },

    status: {
      type: String,
      enum: ['PENDING', 'READY', 'DISCONNECTED'],
      default: 'PENDING',
      comment: 'Current status of the session lifecycle.',
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: null,
      comment: 'Phone number linked to this WhatsApp session (if available).',
    },

    isAuthenticated: {
      type: Boolean,
      default: false,
      comment: 'Indicates whether the user has completed QR authentication.',
    },

    authPath: {
      type: String,
      trim: true,
      default: null,
      comment: 'Filesystem path to stored WhatsApp session data.',
    },
  },
  {
    timestamps: true, // ✅ adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

// ✅ Pre-save hook to update timestamp manually (optional safeguard)
UserSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ✅ Index for faster queries by sessionId + status
UserSessionSchema.index({ sessionId: 1, status: 1 });

// ✅ Virtual: Human-readable summary
UserSessionSchema.virtual('summary').get(function () {
  return {
    sessionId: this.sessionId,
    phoneNumber: this.phoneNumber,
    status: this.status,
    isAuthenticated: this.isAuthenticated,
    lastUpdated: this.updatedAt,
  };
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
