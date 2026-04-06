const mongoose = require('mongoose');
const PDFParser = require("pdf2json");
const mammoth = require("mammoth");
const vectorService = require('./vector.service');

class RagService {
  chunkText(text, size = 1000, overlap = 200) {
    const chunks = [];
    if (!text) return [];
    
    let index = 0;
    while (index < text.length) {
      chunks.push(text.slice(index, index + size));
      index += (size - overlap);
      if (size <= overlap) break;
    }
    return chunks;
  }

  async extractText(buffer, mimetype) {
    if (mimetype === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        
        pdfParser.on("pdfParser_dataError", (errData) => 
          reject(new Error(errData?.parserError || "PDF parsing failed"))
        );

        pdfParser.on("pdfParser_dataReady", () => {
          try {
            const rawText = pdfParser.getRawTextContent();
            if (!rawText || rawText.trim().length === 0) {
              return reject(new Error("PDF is empty or non-selectable"));
            }
            
            const cleanText = rawText
              .replace(/----------------page \(\d+\) break----------------/g, " ")
              .replace(/\\r\\n/g, " ")
              .replace(/\s+/g, " ")
              .trim();
              
            resolve(cleanText);
          } catch (err) {
            reject(err);
          }
        });
        pdfParser.parseBuffer(buffer);
      });
    }

    if (mimetype.includes('wordprocessingml') || mimetype.includes('msword')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf8');
    }

    return "";
  }

  async processAndSearch(buffer, mimetype, query, userId) {
    try {
      const rawText = await this.extractText(buffer, mimetype);
      
      if (!rawText || rawText.trim().length < 10) {
        throw new Error("Document appears to be empty or unreadable.");
      }

      const chunks = this.chunkText(rawText);
      const tempDocId = new mongoose.Types.ObjectId();

      await vectorService.indexDocument(chunks, tempDocId, userId);
      const contextResults = await vectorService.searchSimilarChunks(query, tempDocId, userId);

      return contextResults.map(res => res.content);
    } catch (error) {
      console.error("[RAG Service] Failure:", error.message);
      return [`Error: ${error.message}`];
    }
  }

  async getRelevantContext(query, documentId, userId) {
    try {
      if (!documentId || !mongoose.isValidObjectId(documentId)) return [];
      const results = await vectorService.searchSimilarChunks(query, documentId, userId);
      return results.map(res => res.content);
    } catch (error) {
      console.error("[RAG Service] Retrieval Failure:", error.message);
      return [];
    }
  }
}

module.exports = new RagService();