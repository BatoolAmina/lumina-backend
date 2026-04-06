const mongoose = require('mongoose');
const VectorChunk = require('../models/VectorChunk');
const hfService = require('./hf.service');

class VectorService {
  async indexDocument(chunks, documentId, userId) {
    try {
      if (!chunks || chunks.length === 0) return 0;

      const batchSize = 5;
      let totalIndexed = 0;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const vectorDataResults = await Promise.all(
          batch.map(async (content, index) => {
            try {
              const embedding = await hfService.generateEmbedding(content);
              
              if (!Array.isArray(embedding)) return null;

              return {
                documentId: new mongoose.Types.ObjectId(documentId),
                owner: new mongoose.Types.ObjectId(userId),
                content,
                embedding,
                metadata: { 
                  chunkIndex: i + index,
                  indexedAt: new Date()
                }
              };
            } catch (err) {
              console.error(`[Vector Engine] Chunk ${i + index} failed:`, err.message);
              return null;
            }
          })
        );

        const validVectors = vectorDataResults.filter(v => v !== null);

        if (validVectors.length > 0) {
          await VectorChunk.insertMany(validVectors, { ordered: false });
          totalIndexed += validVectors.length;
        }
      }

      console.log(`[Lumina Architect] Successfully indexed ${totalIndexed} vectors for Doc: ${documentId}`);
      return totalIndexed;
    } catch (error) {
      throw new Error(`Neural Indexing Failed: ${error.message}`);
    }
  }

  async searchSimilarChunks(query, documentId, userId, limit = 5) {
    try {
      const queryVector = await hfService.generateEmbedding(query);

      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryVector,
            numCandidates: 100,
            limit: limit,
            filter: {
              documentId: new mongoose.Types.ObjectId(documentId),
              owner: new mongoose.Types.ObjectId(userId)
            }
          }
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" }
          }
        },
        {
          $project: {
            embedding: 0,
            __v: 0
          }
        }
      ];

      const results = await VectorChunk.aggregate(pipeline);
      const relevantResults = results.filter(res => res.score > 0.5);
      
      return relevantResults;
    } catch (error) {
      throw new Error(`Vector Search Protocol Failed: ${error.message}`);
    }
  }

  async deleteVectorsByDocId(documentId) {
    try {
      const result = await VectorChunk.deleteMany({ 
        documentId: new mongoose.Types.ObjectId(documentId) 
      });
      return result;
    } catch (error) {
      throw new Error(`Memory Wipe Failed: ${error.message}`);
    }
  }
}

module.exports = new VectorService();