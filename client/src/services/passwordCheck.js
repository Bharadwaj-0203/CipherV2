// src/services/passwordCheck.js
export const checkPasswordStrength = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return { isStrong: minLength && hasNumber && hasUpper && hasLower && hasSpecial };
  };