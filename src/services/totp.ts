import * as OTPAuth from 'otpauth';
import { TOTPSecret } from '../types';

/**
 * Generate a random secret for TOTP using cryptographically secure random bytes
 */
export function generateSecret(): string {
  // Generate 20 random bytes (160 bits) using cryptographically secure method
  const randomBytes = new Uint8Array(20);
  // Use crypto.getRandomValues for secure random generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for environments without crypto API
    // This is less secure but ensures functionality
    for (let i = 0; i < 20; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Use the Secret constructor with the bytes buffer
  const secret = new OTPAuth.Secret({ buffer: randomBytes.buffer });
  return secret.base32;
}

/**
 * Create a TOTP instance from secret
 */
export function createTOTP(secret: string, label: string = 'SocialAlarm'): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: 'SocialAlarm',
    label: label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/**
 * Generate current TOTP code from secret
 */
export function generateCode(secret: string): string {
  const totp = createTOTP(secret);
  return totp.generate();
}

/**
 * Validate a TOTP code against a secret
 * Returns true if the code is valid within a window of ±1 period
 */
export function validateCode(secret: string, code: string): boolean {
  const totp = createTOTP(secret);
  // delta returns null if invalid, or the number of periods the code is off by
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPUri(secret: string, label: string = 'SocialAlarm'): string {
  const totp = createTOTP(secret, label);
  return totp.toString();
}

/**
 * Parse a TOTP URI and extract the secret
 */
export function parseTOTPUri(uri: string): TOTPSecret | null {
  try {
    const totp = OTPAuth.URI.parse(uri);
    if (totp instanceof OTPAuth.TOTP) {
      return {
        secret: totp.secret.base32,
        label: totp.label,
        issuer: totp.issuer,
        algorithm: totp.algorithm as 'SHA1' | 'SHA256' | 'SHA512',
        digits: totp.digits,
        period: totp.period,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculate time remaining until next code rotation
 */
export function getTimeRemaining(): number {
  const period = 30;
  const currentTime = Math.floor(Date.now() / 1000);
  return period - (currentTime % period);
}
