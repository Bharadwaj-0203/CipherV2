// client/src/services/encryption/keyManager.js
import { JSEncrypt } from 'jsencrypt';

class KeyManager {
  constructor() {
    this.rsaEncrypt = new JSEncrypt({ default_key_size: 2048 });
    this.keyPair = null;
    this.sessionKeys = new Map(); // Store session keys for each chat partner
  }

  generateKeyPair() {
    this.keyPair = this.rsaEncrypt.getKey();
    return {
      publicKey: this.keyPair.getPublicKey(),
      privateKey: this.keyPair.getPrivateKey()
    };
  }

  getPublicKey() {
    return this.keyPair?.getPublicKey();
  }

  getPrivateKey() {
    return this.keyPair?.getPrivateKey();
  }

  setSessionKey(partnerId, key) {
    this.sessionKeys.set(partnerId, key);
  }

  getSessionKey(partnerId) {
    return this.sessionKeys.get(partnerId);
  }
}

export const keyManager = new KeyManager();

// client/src/services/encryption/messageEncryption.js
import CryptoJS from 'crypto-js';
import { keyManager } from './keyManager';

export const messageEncryption = {
  encryptMessage: (message, recipientId, recipientPublicKey) => {
    let sessionKey = keyManager.getSessionKey(recipientId);
    
    if (!sessionKey) {
      sessionKey = CryptoJS.lib.WordArray.random(256/8).toString();
      keyManager.setSessionKey(recipientId, sessionKey);
    }

    // Encrypt message with AES
    const encryptedMessage = CryptoJS.AES.encrypt(message, sessionKey).toString();

    // Encrypt session key with recipient's public key
    const rsaEncrypt = new JSEncrypt();
    rsaEncrypt.setPublicKey(recipientPublicKey);
    const encryptedSessionKey = rsaEncrypt.encrypt(sessionKey);

    return {
      message: encryptedMessage,
      sessionKey: encryptedSessionKey
    };
  },

  decryptMessage: (encryptedData) => {
    const { message, sessionKey } = encryptedData;
    
    // Decrypt session key with private key
    const rsaDecrypt = new JSEncrypt();
    rsaDecrypt.setPrivateKey(keyManager.getPrivateKey());
    const decryptedSessionKey = rsaDecrypt.decrypt(sessionKey);

    // Decrypt message with session key
    const bytes = CryptoJS.AES.decrypt(message, decryptedSessionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
};