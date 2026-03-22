import db from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "USER_LOGIN"
  | "CUSTOMER_CREATE"
  | "CUSTOMER_UPDATE"
  | "CUSTOMER_DELETE"
  | "ORDER_STATUS_CHANGE"
  | "SHOP_DISCONNECT";

interface AuditLogParams {
  action: AuditAction;
  userId: string;
  targetId?: string;
  targetType?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Create an audit log entry. Fire-and-forget — errors are logged
 * but never thrown so callers are not disrupted.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId,
        targetId: params.targetId ?? null,
        targetType: params.targetType ?? null,
        metadata: params.metadata ?? null,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to create entry:", error);
  }
}
