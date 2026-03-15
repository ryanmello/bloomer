import jwt from "jsonwebtoken";

const SECRET = process.env.UNSUBSCRIBE_SECRET;
const EXPIRES_IN = "30d";

export interface UnsubscribePayload {
  customerId: string;
}

/**
 * Generate a signed JWT for the unsubscribe link. Use at send time.
 */
export function signUnsubscribeToken(customerId: string): string {
  if (!SECRET) {
    throw new Error("UNSUBSCRIBE_SECRET is not set in environment variables");
  }
  return jwt.sign({ customerId } as UnsubscribePayload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode the unsubscribe token. Use in the unsubscribe/subscribe routes.
 */
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  if (!SECRET) {
    throw new Error("UNSUBSCRIBE_SECRET is not set in environment variables");
  }
  try {
    const decoded = jwt.verify(token, SECRET) as UnsubscribePayload;
    return decoded && decoded.customerId ? decoded : null;
  } catch {
    return null;
  }
}
