const crypto = require('crypto');

class EncryptionManager {
  generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
  }

  hashPassword(password) {
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256');
    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  verifyPassword(password, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(
      password, 
      Buffer.from(salt, 'hex'), 
      10000, 
      64, 
      'sha256'
    ).toString('hex');
    return verifyHash === hash;
  }
}

module.exports = new EncryptionManager();