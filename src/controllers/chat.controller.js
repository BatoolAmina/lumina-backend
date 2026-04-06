const mongoose = require('mongoose');
const Message = require('../models/Message');
const Room = require('../models/Room');
const hfService = require('../services/hf.service');
const ragService = require('../services/rag.service');
const vectorService = require('../services/vector.service');

exports.sendMessage = async (req, res, next) => {
  try {
    const { content, chatId, documentId, roomId, imageAction, isEdit, editMessageId } = req.body;
    const files = req.files;
    const singleFile = req.file;
    const userId = req.user?._id;

    const uploadedFiles = files || (singleFile ? [singleFile] : []);

    if (!content && uploadedFiles.length === 0 && imageAction !== 'generate') {
      return res.status(422).json({
        status: 'fail',
        message: 'Neural Input Required: Text or file missing'
      });
    }

    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room || !room.participants.includes(userId)) {
        return res.status(403).json({
          status: 'fail',
          message: 'Sector Access Denied: Not a room participant'
        });
      }
    }

    const isNewChat = !chatId && !roomId;
    const resolvedChatId = chatId || roomId || `chat_${userId}_${Date.now()}`;
    const formattedContent = content ? content.trim() : '';
    const normalizedTitle = formattedContent
      ? (formattedContent.substring(0, 40) + (formattedContent.length > 40 ? '...' : ''))
      : 'New Protocol';

    if (isEdit && editMessageId) {
      const originalMessage = await Message.findById(editMessageId);
      if (!originalMessage) {
        return res.status(404).json({ status: 'fail', message: 'Original message not found' });
      }

      await Message.deleteMany({
        chatId: resolvedChatId,
        createdAt: { $gt: originalMessage.createdAt }
      });

      const updateData = { content: formattedContent };
      const firstMsg = await Message.findOne({ chatId: resolvedChatId }).sort({ createdAt: 1 });
      if (firstMsg && firstMsg._id.toString() === editMessageId) {
        updateData.title = normalizedTitle;
      }

      await Message.findByIdAndUpdate(editMessageId, updateData);
    }

    const promptLower = content ? content.toLowerCase() : "";
    let intent = 'content';
    if (imageAction === 'generate' || promptLower.includes('generate') || promptLower.includes('draw')) {
      intent = 'image';
    } else if (uploadedFiles.length > 0) {
      const mt = uploadedFiles[0].mimetype;
      if (mt.startsWith('image/')) {
        intent = 'image_analyzer';
      } else if (
        mt === 'application/pdf' ||
        mt.includes('word') ||
        mt === 'text/plain'
      ) {
        intent = 'pdf';
      }
    } else if (documentId) {
      intent = 'pdf';
    } else if (promptLower.includes('code') || promptLower.includes('```')) {
      intent = 'code';
    }

    let userMsg;
    if (!isEdit) {
      const attachments = uploadedFiles.map(f => ({
        fileName: f.originalname,
        fileType: f.mimetype
      }));

      userMsg = await Message.create({
        chatId: resolvedChatId,
        sender: userId,
        role: 'user',
        content: formattedContent || (uploadedFiles.length > 0 ? `Action: ${intent} on ${uploadedFiles[0].originalname}` : ""),
        engineUsed: intent === 'image' ? 'flux' : intent,
        roomId: roomId || undefined,
        attachments: attachments,
        title: isNewChat ? normalizedTitle : undefined
      });
    } else {
      userMsg = await Message.findById(editMessageId);
    }

    let botMsgData = {
      chatId: resolvedChatId,
      sender: userId,
      role: 'assistant',
      roomId: roomId || undefined,
      engineUsed: intent === 'image' ? 'flux' : intent,
      title: (isNewChat || isEdit) ? normalizedTitle : undefined
    };

    if (intent === 'image') {
      const imageBlob = await hfService.generateImage(content);
      const buffer = Buffer.from(await imageBlob.arrayBuffer());
      botMsgData.content = `Architected image for: "${content}"`;
      botMsgData.imageUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    } else {
      let context = [];
      if (intent === 'pdf' && uploadedFiles.length > 0) {
        context = await ragService.processAndSearch(uploadedFiles[0].buffer, uploadedFiles[0].mimetype, formattedContent || "Analyze this document", userId);
      } else if (documentId && formattedContent) {
        context = await ragService.getRelevantContext(formattedContent, documentId, userId);
      }

      const history = await Message.find({ chatId: resolvedChatId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const formattedHistory = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const aiResponse = await hfService.generateResponse(
        formattedContent || (intent === 'image_analyzer' ? "Describe this image" : "Analyze document"),
        context,
        intent,
        formattedHistory,
        (uploadedFiles.length > 0 && intent === 'image_analyzer') ? uploadedFiles[0].buffer : null
      );

      botMsgData.content = aiResponse;
      botMsgData.contextUsed = mongoose.isValidObjectId(documentId) ? documentId : (uploadedFiles.length > 0 && intent === 'pdf' ? new mongoose.Types.ObjectId() : null);
      botMsgData.metadata = { sourcesCount: context.length };
    }

    const botMsg = await Message.create(botMsgData);
    const firstMsgRecord = await Message.findOne({ chatId: resolvedChatId }).sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        userMessage: userMsg,
        botMessage: botMsg,
        chatId: resolvedChatId,
        isFirstMessage: isNewChat || (isEdit && userMsg._id.toString() === firstMsgRecord._id.toString())
      }
    });

  } catch (err) {
    console.error("CRITICAL CONTROLLER ERROR:", err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getChatList = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const chats = await Message.aggregate([
      { 
        $match: { 
          sender: new mongoose.Types.ObjectId(userId),
          roomId: { $exists: false } 
        } 
      },
      { $sort: { createdAt: 1 } },
      { 
        $group: { 
          _id: "$chatId", 
          firstTitle: { $first: "$title" },
          firstContent: { $first: "$content" },
          firstRole: { $first: "$role" },
          lastActive: { $max: "$createdAt" } 
        } 
      },
      {
        $project: {
          _id: 1,
          title: {
            $switch: {
              branches: [
                {
                  case: { $gt: [{ $strLenCP: { $ifNull: ["$firstTitle", ""] } }, 0] },
                  then: "$firstTitle"
                },
                {
                  case: { $and: [ { $eq: ["$firstRole", "user"] }, { $gt: [{ $strLenCP: { $ifNull: ["$firstContent", ""] } }, 0] } ] },
                  then: {
                    $concat: [
                      { $substrCP: ["$firstContent", 0, 40] },
                      {
                        $cond: [
                          { $gt: [{ $strLenCP: "$firstContent" }, 40] },
                          "...",
                          ""
                        ]
                      }
                    ]
                  }
                }
              ],
              default: "Untitled Protocol"
            }
          },
          lastActive: 1
        }
      },
      { $sort: { lastActive: -1 } }
    ]);
    res.status(200).json({ status: 'success', data: { chats } });
  } catch (err) {
    next(err);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('contextUsed', 'fileName fileType') 
      .lean();

    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      isImage: !!msg.imageUrl,
      hasAttachments: msg.attachments && msg.attachments.length > 0
    }));

    res.status(200).json({ 
      status: 'success', 
      results: sanitizedMessages.length, 
      data: { messages: sanitizedMessages } 
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteChatHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await Message.deleteMany({ chatId, sender: req.user._id });
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};

exports.queryDocument = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;
    const chunks = await vectorService.searchSimilarChunks(question, documentId, req.user._id);
    const answer = await hfService.generateResponse(question, chunks.map(c => c.content), 'pdf');
    res.status(200).json({ status: 'success', data: { answer, sources: chunks.length } });
  } catch (err) {
    next(err);
  }
};

exports.renameChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const result = await Message.updateMany(
      { chatId: chatId, sender: userId },
      { $set: { title: title } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No protocol found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Protocol renamed successfully'
    });
  } catch (err) {
    console.error("RENAME ERROR:", err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};