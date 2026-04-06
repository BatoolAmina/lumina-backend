const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies) {
      token = req.cookies.jwt || 
              req.cookies['next-auth.session-token'] || 
              req.cookies['__Secure-next-auth.session-token'];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Neural Protocol Denied: No active link detected. Please log in.'
      });
    }

    let currentUser;
    let decoded;

    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      currentUser = await User.findById(decoded.id);
    } catch (err) {
      currentUser = await User.findOne({
        $or: [
          { externalProviderId: token },
          { email: token } 
        ]
      });
    }

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The identity associated with this neural link no longer exists.'
      });
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
      const tokenData = decoded || jwt.decode(token);
      
      if (tokenData && tokenData.iat < changedTimestamp) {
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