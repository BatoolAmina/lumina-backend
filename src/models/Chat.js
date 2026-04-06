const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A chat must have a title'],
    trim: true,
    maxlength: [100, 'Chat title cannot exceed 100 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isCollaboration: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: String,
    trim: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ChatSchema.index({ owner: 1, lastActive: -1 });

module.exports = mongoose.model('Chat', ChatSchema);