// client/src/services/encryption.js
import CryptoJS from 'crypto-js';
import { JSEncrypt } from 'jsencrypt';

class EncryptionService {
  constructor() {
    this.rsaEncrypt = new JSEncrypt({ default_key_size: 2048 });
    this.keyPair = null;
    this.peerPublicKeys = new Map();
    this.sessionKeys = new Map();
  }

  initialize() {
    // Generate RSA key pair
    this.keyPair = this.rsaEncrypt.getKey();
    return this.keyPair.getPublicKey();
  }

  // Store peer's public key
  storePeerKey(peerId, publicKey) {
    this.peerPublicKeys.set(peerId, publicKey);
  }

  // Generate session key for a peer
  generateSessionKey(peerId) {
    const sessionKey = CryptoJS.lib.WordArray.random(256/8).toString();
    this.sessionKeys.set(peerId, sessionKey);
    return sessionKey;
  }

  // Encrypt message for peer
  encryptMessage(message, peerId) {
    // Get or generate session key
    let sessionKey = this.sessionKeys.get(peerId);
    if (!sessionKey) {
      sessionKey = this.generateSessionKey(peerId);
    }

    // Get peer's public key
    const peerPublicKey = this.peerPublicKeys.get(peerId);
    if (!peerPublicKey) {
      throw new Error('Peer public key not found');
    }

    // Encrypt message with session key
    const encryptedContent = CryptoJS.AES.encrypt(message, sessionKey).toString();

    // Encrypt session key with peer's public key
    this.rsaEncrypt.setPublicKey(peerPublicKey);
    const encryptedSessionKey = this.rsaEncrypt.encrypt(sessionKey);

    return {
      encryptedContent,
      encryptedSessionKey
    };
  }

  // Decrypt message from peer
  decryptMessage(encryptedContent, encryptedSessionKey) {
    // Decrypt session key with private key
    this.rsaEncrypt.setPrivateKey(this.keyPair.getPrivateKey());
    const sessionKey = this.rsaEncrypt.decrypt(encryptedSessionKey);
    
    // Decrypt message with session key
    const bytes = CryptoJS.AES.decrypt(encryptedContent, sessionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

export const encryptionService = new EncryptionService();