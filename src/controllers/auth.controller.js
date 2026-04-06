const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { SECURITY } = require('../config/constants');
const { AppError } = require('../utils/errorHandler');
const crypto = require('crypto');

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Internal Configuration Error: JWT_SECRET is missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: SECURITY.JWT_EXPIRE || '24h'
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (SECURITY.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.secure || req.get('x-forwarded-proto') === 'https',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  };

  res.cookie('jwt', token, cookieOptions);
  
  const userObject = user.toObject();
  delete userObject.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { 
      user: userObject 
    }
  });
};

exports.externalLogin = async (req, res, next) => {
  try {
    const { email, name, avatar, providerId } = req.body;

    if (!email) {
      return next(new AppError('Neural Sync Failure: Email identity required.', 400));
    }

    let user = await User.findOne({ email });

    if (!user) {
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: generatedPassword,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=0D8ABC&color=fff`,
        isExternal: true,
        externalProviderId: providerId
      });
    } else if (providerId && !user.externalProviderId) {
      user.externalProviderId = providerId;
      user.isExternal = true;
      await user.save({ validateBeforeSave: false });
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.name)}&background=random`
    });

    createSendToken(newUser, 201, req, res);
  } catch (err) {
    if (err.code === 11000) return next(new AppError('Neural Identity already exists. Use a different email.', 400));
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Authentication Failure: Credentials missing.', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new AppError('Neural Protocol Denied: Incorrect email or password.', 401));
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('Identity lost. Please re-authenticate.', 404));

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.secure || req.get('x-forwarded-proto') === 'https',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  });
  
  res.status(200).json({ 
    status: 'success',
    message: 'Neural Link Severed. Session terminated.' 
  });
};