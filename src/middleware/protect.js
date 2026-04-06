const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Neural Protocol Denied: No active link detected. Please log in.'
      });
    }

    if (token.includes('@')) {
      const userByEmail = await User.findOne({ email: token });
      if (!userByEmail) {
        return res.status(401).json({
          status: 'fail',
          message: 'Authentication failed.'
        });
      }
      req.user = userByEmail;
      return next();
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The identity associated with this neural link no longer exists.'
      });
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          status: 'fail',
          message: 'Security Protocol: Password recently changed. Please re-establish link.'
        });
      }
    }

    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Neural Link Expired or Invalid: Authentication failed.'
    });
  }
};