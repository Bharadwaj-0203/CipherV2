// server/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateKeyPair = () => {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
};

const authController = {
  register: async (req, res) => {
    try {
      console.log('Registration attempt:', req.body);
      const { username, password } = req.body;

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      // Generate RSA keypair
      const { publicKey, privateKey } = generateKeyPair();
      
      // Hash password with bcrypt
      const { hash, salt } = await hashPassword(password);

      // Create new user
      const user = new User({
        username,
        password: hash,
        salt,
        publicKey,
        privateKey
      });

      await user.save();
      console.log('User created successfully:', username);

      // Create token
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
          publicKey: user.publicKey
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  login: async (req, res) => {
    try {
      console.log('Login attempt:', req.body);
      const { username, password } = req.body;

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password with bcrypt
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      user.lastActive = Date.now();
      await user.save();

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful:', username);

      res.json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          token,
          publicKey: user.publicKey
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authController;