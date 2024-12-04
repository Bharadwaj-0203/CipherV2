// Secret encryption key (shared secret)
const ENCRYPTION_KEY = 'YourSecretEncryptionKey12345678901234';

class EncryptionService {
  constructor() {
    // Holds the encryption key after initialization
    this.key = null;
  }

  async initialize() {
    // Convert key to binary and hash it to 256 bits (SHA-256)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ENCRYPTION_KEY);
    const hash = await crypto.subtle.digest('SHA-256', keyData);

    // Import the hashed key for AES-GCM encryption/decryption
    this.key = await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  async encryptMessage(message) {
    if (!this.key) await this.initialize(); // Ensure key is ready

    // Convert plaintext to binary
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Generate a unique IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data using AES-GCM
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, data);

    // Return encrypted data and IV as Base64 strings
    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  async decryptMessage(encryptedData, iv) {
    if (!this.key) await this.initialize(); // Ensure key is ready

    // Decrypt the data using AES-GCM and return plaintext
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToArrayBuffer(iv) },
      this.key,
      this.base64ToArrayBuffer(encryptedData)
    );

    // Convert decrypted binary data to a string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Helper: Convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  // Helper: Convert Base64 to ArrayBuffer
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export instance of the encryption service
export const encryptionService = new EncryptionService();