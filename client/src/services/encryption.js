const ENCRYPTION_KEY = 'YourSecretEncryptionKey12345678901234';

class EncryptionService {
  constructor() {
    this.key = null;
  }

  async initialize() {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    
    // Ensure the key is exactly 256 bits (32 bytes)
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    
    this.key = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptMessage(message) {
    if (!this.key) await this.initialize();

    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.key,
      data
    );

    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  async decryptMessage(encryptedData, iv) {
    if (!this.key) await this.initialize();

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToArrayBuffer(iv) },
      this.key,
      this.base64ToArrayBuffer(encryptedData)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const encryptionService = new EncryptionService();