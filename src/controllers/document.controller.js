const Document = require('../models/Document');
const vectorService = require('../services/vector.service');
const hfService = require('../services/hf.service');
const pdfParser = require('../utils/pdfParser');
const textChunker = require('../utils/textChunker');
const { AppError } = require('../utils/errorHandler');
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file using the "file" field', 400));
    }
    const { buffer, originalname, size, mimetype } = req.file;
    const userId = req.user._id;
    const rawText = await pdfParser.extractText(buffer);
    if (!rawText || rawText.trim().length === 0) {
      return next(new AppError('Could not extract text from PDF. The file might be empty or contain only images.', 400));
    }
    const newDoc = await Document.create({
      owner: userId,
      fileName: originalname,
      fileSize: size,
      mimeType: mimetype,
      status: 'indexing'
    });
    const chunks = textChunker.split(rawText);
    const vectorCount = await vectorService.indexDocument(chunks, newDoc._id, userId);
    newDoc.status = 'ready';
    newDoc.vectorCount = vectorCount;
    await newDoc.save();
    res.status(201).json({
      status: 'success',
      data: {
        document: newDoc
      }
    });
  } catch (err) {
    next(err);
  }
};
exports.queryDocument = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;
    const userId = req.user._id;
    if (!documentId || !question) {
      return next(new AppError('Please provide documentId and question', 400));
    }
    const relevantChunks = await vectorService.searchSimilarChunks(
      question,
      documentId,
      userId
    );
    const context = relevantChunks.map(chunk => chunk.content);
    const answer = await hfService.generateResponse(question, context, 'pdf');
    res.status(200).json({
      status: 'success',
      data: {
        answer,
        sources: relevantChunks.length
      }
    });
  } catch (err) {
    next(err);
  }
};
exports.getUserDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ owner: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        documents: docs
      }
    });
  } catch (err) {
    next(err);
  }
};
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!doc) {
      return next(new AppError('No document found with that ID belonging to you', 404));
    }
    await vectorService.deleteVectorsByDocId(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};