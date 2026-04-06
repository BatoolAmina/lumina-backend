const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    index: true,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    index: true,
    sparse: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.imageUrl; 
    }
  },
  imageUrl: {
    type: String
  },
  engineUsed: {
    type: String,
    enum: ['content', 'code', 'pdf', 'image_analyzer', 'flux', 'vision', 'image'],
    default: 'content'
  },
  contextUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  metadata: {
    sourcesCount: { type: Number, default: 0 },
    tokens: { type: Number },
    latency: { type: Number }
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String
  }],
  title: {
    type: String,
    default: null
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

MessageSchema.index({ sender: 1, chatId: 1, createdAt: -1 });

MessageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);