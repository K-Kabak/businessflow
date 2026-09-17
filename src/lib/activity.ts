import "server-only";

import type {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "@/generated/prisma/client";

type ActivityClient = Prisma.TransactionClient;

export async function logActivity(
  tx: ActivityClient,
  input: {
    organizationId: string;
    userId: string | null;
    entityType: ActivityEntityType;
    entityId?: string | null;
    action: ActivityAction;
    description: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return tx.activityLog.create({ data: input });
}
