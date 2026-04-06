const mongoose = require('mongoose');

const VectorChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true,
    validate: [
      (val) => val.length === 384, 
      'Embedding must be exactly 384 dimensions'
    ]
  },
  metadata: {
    pageNumber: Number,
    chunkIndex: Number,
    contentLength: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' 
  }
}, { 
  timestamps: true 
});

VectorChunkSchema.index({ owner: 1, documentId: 1 });

module.exports = mongoose.model('VectorChunk', VectorChunkSchema);