const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  status: {
    type: String,
    enum: ['uploading', 'indexing', 'ready', 'error'],
    default: 'uploading'
  },
  vectorCount: {
    type: Number,
    default: 0
  },
  summary: {
    type: String, 
    trim: true
  },
  metadata: {
    totalPages: Number,
    extractedLanguage: { type: String, default: 'en' },
    lastAnalyzed: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

DocumentSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Document', DocumentSchema);