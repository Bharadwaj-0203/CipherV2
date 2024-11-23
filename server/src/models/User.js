// server/src/models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  salt: {
    type: String,
    required: [true, 'Salt is required']
  },
  publicKey: {
    type: String
  },
  privateKey: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

userSchema.methods.setPassword = function(password) {
  // Increase iterations and key length for stronger security
  this.salt = crypto.randomBytes(32).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

userSchema.methods.validPassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.password === hash;
};

userSchema.set('toJSON', {
  transform: function(doc, ret, opt) {
    delete ret.password;
    delete ret.salt;
    delete ret.privateKey;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;