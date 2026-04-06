const PDFParser = require("pdf2json");

const chunkText = (text, size = 1000, overlap = 200) => {
  const chunks = [];
  let index = 0;

  if (!text) return [];

  while (index < text.length) {
    const chunk = text.slice(index, index + size);
    chunks.push(chunk);
    index += (size - overlap);
    
    if (size <= overlap) break; 
  }

  return chunks;
};

const extractText = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData) => {
      const errorMessage = errData?.parserError || "Neural Link Error: PDF parsing failed.";
      reject(new Error(errorMessage));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        
        if (!rawText || rawText.trim().length === 0) {
          return reject(new Error("Architectural Failure: PDF is empty or contains only non-selectable images."));
        }

        const cleanText = rawText
          .replace(/----------------page \(\d+\) break----------------/g, " ")
          .replace(/\\r\\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const chunks = chunkText(cleanText, 1000, 200);

        resolve({
          fullText: cleanText,
          chunks: chunks
        });
      } catch (err) {
        reject(new Error(`Data Reconstruction Failed: ${err.message}`));
      }
    });

    pdfParser.parseBuffer(fileBuffer);
  });
};

module.exports = { 
  extractText,
  chunkText 
};  