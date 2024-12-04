//src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateDHKeys = () => {
  try {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();

    return {
      dhPrivateKey: ecdh.getPrivateKey('base64'),
      dhPublicKey: ecdh.getPublicKey('base64', 'compressed')
    };
  } catch (error) {
    console.error('Key generation error:', error);
    throw error;
  }
};

const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const { dhPrivateKey, dhPublicKey } = generateDHKeys();
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      password: hashedPassword,
      dhPrivateKey,
      dhPublicKey,
      isOnline: true
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        token,
        dhPrivateKey,
        dhPublicKey
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username })
      .select('+password +dhPrivateKey');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastActive: new Date()
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        token,
        dhPrivateKey: user.dhPrivateKey,
        dhPublicKey: user.dhPublicKey
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

const verify = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          username: req.user.username,
          dhPublicKey: req.user.dhPublicKey
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastActive: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  register,
  login,
  verify,
  logout
};