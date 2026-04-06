const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  GUEST: 'guest'
};

CHAT_MODELS = {
  CONTENT: 'deepseek-ai/DeepSeek-V3',
  CODE: 'Qwen/Qwen2.5-Coder-32B-Instruct',  
  IMAGE_ANALYZER: 'Qwen/Qwen2.5-VL-7B-Instruct:hyperbolic', 
  IMAGE: 'black-forest-labs/FLUX.1-schnell',
  EMBEDDING: 'sentence-transformers/all-MiniLM-L6-v2'
};

module.exports = { CHAT_MODELS };
const RAG_CONFIG = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  MAX_DOCUMENTS_PER_USER: 50,
  TOP_K: 5,
  SIMILARITY_THRESHOLD: 0.5
};

const SECURITY = {
  JWT_EXPIRE: '7d',
  COOKIE_EXPIRE: 7,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  AI_LIMIT_MAX_REQUESTS: 15
};

const ROOM_EVENTS = {
  JOIN: 'join-room',
  LEAVE: 'leave-room',
  MESSAGE: 'new-message',
  TYPING: 'user-typing',
  AI_RESPONSE: 'ai-token-stream',
  IMAGE_READY: 'image-generated',
  ERROR: 'ai-error',
  STATUS_UPDATE: 'document-status'
};

module.exports = {
  ROLES,
  CHAT_MODELS,
  RAG_CONFIG,
  SECURITY,
  ROOM_EVENTS
};