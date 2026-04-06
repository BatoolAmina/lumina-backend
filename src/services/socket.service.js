const { ROOM_EVENTS } = require('../config/constants');
class SocketService {
  constructor() {
    this.io = null;
  }
  init(io) {
    this.io = io;
    this.io.on('connection', (socket) => {
      socket.on(ROOM_EVENTS.JOIN, (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', { socketId: socket.id });
        console.log(`[Lumina] Socket ${socket.id} joined Room: ${roomId}`);
      });
      socket.on(ROOM_EVENTS.TYPING, ({ roomId, isTyping }) => {
        socket.to(roomId).emit(ROOM_EVENTS.TYPING, { isTyping });
      });
      socket.on('engine-routing', ({ roomId, engine }) => {
        socket.to(roomId).emit('engine-active', { engine });
      });
      socket.on(ROOM_EVENTS.LEAVE, (roomId) => {
        socket.leave(roomId);
        console.log(`[Lumina] Socket ${socket.id} left Room: ${roomId}`);
      });
      socket.on('disconnect', () => {
      });
    });
  }
  broadcastAITokens(roomId, token, engineType) {
    if (this.io) {
      this.io.to(roomId).emit(ROOM_EVENTS.AI_RESPONSE, { 
        token, 
        engine: engineType 
      });
    }
  }
  sendFullMessage(roomId, data) {
    if (this.io) {
      this.io.to(roomId).emit(ROOM_EVENTS.MESSAGE, data);
    }
  }
  emitError(roomId, message) {
    if (this.io) {
      this.io.to(roomId).emit(ROOM_EVENTS.ERROR, { 
        status: 'error',
        message: message 
      });
    }
  }
  notifyStatusUpdate(roomId, documentId, status) {
    if (this.io) {
      this.io.to(roomId).emit(ROOM_EVENTS.STATUS_UPDATE, { 
        documentId, 
        status 
      });
    }
  }
  broadcastEngineSwitch(roomId, engineName) {
    if (this.io) {
      this.io.to(roomId).emit('engine-switched', { 
        engine: engineName,
        timestamp: new Date()
      });
    }
  }
}
module.exports = new SocketService();