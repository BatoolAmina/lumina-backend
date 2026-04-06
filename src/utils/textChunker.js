const { RAG_CONFIG } = require('../config/constants');

const split = (text, size = RAG_CONFIG?.CHUNK_SIZE || 1500, overlap = RAG_CONFIG?.CHUNK_OVERLAP || 300) => {
  if (!text || typeof text !== 'string') return [];

  const chunks = [];
  const cleanText = text.replace(/\s+/g, ' ').replace(/\\r\\n/g, ' ').trim();

  if (cleanText.length <= size) {
    return [cleanText];
  }

  let i = 0;
  while (i < cleanText.length) {
    let end = i + size;

    if (end < cleanText.length) {
      const lastSpace = cleanText.lastIndexOf(' ', end);
      if (lastSpace > i) {
        end = lastSpace;
      }
    }

    const chunk = cleanText.substring(i, end).trim();

    if (chunk && chunk.length > 10) {
      chunks.push(chunk);
    }

    const nextStart = end - overlap;

    if (nextStart <= i) {
      i = end;
    } else {
      i = nextStart;
    }

    if (i >= cleanText.length || chunks.length > 2000) break;
  }

  return chunks;
};

module.exports = { split };