const Room = require('../models/Room');
const Message = require('../models/Message');
const crypto = require('crypto');
const { AppError } = require('../utils/errorHandler');

exports.createRoom = async (req, res, next) => {
  try {
    const { name, documentId } = req.body;
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const newRoom = await Room.create({
      name,
      host: req.user._id,
      inviteCode,
      documentId,
      participants: [req.user._id],
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      data: { room: newRoom }
    });
  } catch (err) {
    next(err);
  }
};

exports.joinRoom = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    const room = await Room.findOne({ inviteCode, isActive: true });
    
    if (!room) {
      return next(new AppError('Neural Link Refused: Invalid or inactive invite code', 404));
    }

    const isAlreadyIn = room.participants.some(id => id.toString() === userId.toString());
    
    if (!isAlreadyIn) {
      room.participants.push(userId);
      await room.save();
    }

    res.status(200).json({
      status: 'success',
      data: { room }
    });
  } catch (err) {
    next(err);
  }
};

exports.getRoomDetails = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('participants', 'name email avatar')
      .populate('documentId', 'fileName')
      .populate('host', 'name');

    if (!room) {
      return next(new AppError('Room not found in the architectural grid', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { room }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ participants: req.user._id })
      .populate('documentId', 'fileName')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      status: 'success',
      results: rooms.length,
      data: { rooms }
    });
  } catch (err) {
    next(err);
  }
};

exports.leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    const userId = req.user._id;

    if (!room) {
      return next(new AppError('Target room does not exist', 404));
    }

    room.participants = room.participants.filter(
      (id) => id.toString() !== userId.toString()
    );

    if (room.participants.length === 0) {
      await Room.findByIdAndDelete(req.params.id);
      await Message.deleteMany({ roomId: req.params.id });
    } else {
      if (room.host.toString() === userId.toString()) {
        room.host = room.participants[0];
      }
      await room.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Neural link severed. Room exited.'
    });
  } catch (err) {
    next(err);
  }
};