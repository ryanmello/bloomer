import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Configuration for TOTP
authenticator.options = {
  window: 1, // Allow 1 step before and after for time sync issues
};

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code data URL for authenticator apps
 */
export async function generateQRCode(
  email: string,
  secret: string
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, "Bloomer", secret);
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    return false;
  }
}

/**
 * Generate backup codes (format: XXXX-XXXX-XXXX)
 */
export function generateBackupCodes(count: number = 5): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 12 random characters (alphanumeric)
    const randomBytes = crypto.randomBytes(6);
    const code = randomBytes.toString("hex").toUpperCase();
    
    // Format as XXXX-XXXX-XXXX
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push(formattedCode);
  }
  
  return codes;
}

/**
 * Hash backup codes before storing in database
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(
    codes.map((code) => bcrypt.hash(code, 10))
  );
  return hashedCodes;
}

/**
 * Verify a backup code against hashed codes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; index: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(code, hashedCodes[i]);
    if (isValid) {
      return { valid: true, index: i };
    }
  }
  return { valid: false, index: -1 };
}

/**
 * Encrypt a 2FA secret before storing in database
 */
export function encryptSecret(secret: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  
  if (!encryptionKey) {
    throw new Error("Encryption key not found in environment variables");
  }
  
  // Create a key from the encryption key (32 bytes for AES-256)
  const key = crypto.scryptSync(encryptionKey, "salt", 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return IV + encrypted data (we need IV for decryption)
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a 2FA secret from database
 */
export function decryptSecret(encryptedSecret: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  
  if (!encryptionKey) {
    throw new Error("Encryption key not found in environment variables");
  }
  
  // Split IV and encrypted data
  const parts = encryptedSecret.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted secret format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  
  // Create the same key used for encryption
  const key = crypto.scryptSync(encryptionKey, "salt", 32);
  
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Format backup code for display (removes hyphens for comparison)
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}

