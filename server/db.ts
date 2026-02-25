import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertAuthToken, InsertUser, authTokens, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "firstName",
      "lastName",
      "email",
      "whatsapp",
      "city",
      "address",
      "acquisitionSource",
      "preferredLanguage",
      "taxIdEncrypted",
      "taxIdLast4",
      "loginMethod",
      "passwordHash",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.taxIdType !== undefined) {
      values.taxIdType = user.taxIdType;
      updateSet.taxIdType = user.taxIdType;
    }

    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }
    if (user.emailVerifiedAt !== undefined) {
      values.emailVerifiedAt = user.emailVerifiedAt;
      updateSet.emailVerifiedAt = user.emailVerifiedAt;
    }
    if (user.marketingOptIn !== undefined) {
      values.marketingOptIn = user.marketingOptIn;
      updateSet.marketingOptIn = user.marketingOptIn;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByTaxIdTail(input: {
  taxIdType: "cpf" | "cnpj";
  taxIdLast4: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users by taxId: database not available");
    return [];
  }

  const limit = Math.max(1, Math.min(input.limit ?? 25, 100));
  return db
    .select()
    .from(users)
    .where(
      and(
        eq(users.taxIdType, input.taxIdType),
        eq(users.taxIdLast4, input.taxIdLast4),
        isNotNull(users.taxIdEncrypted),
        isNotNull(users.email),
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by id: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(users);
  return Number(result[0]?.count ?? 0);
}

export async function updateUserById(
  id: number,
  updates: Partial<InsertUser>,
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return undefined;
  }

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<InsertUser>;

  if (Object.keys(cleanUpdates).length === 0) {
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return existing;
  }

  await db.update(users).set(cleanUpdates).where(eq(users.id, id));
  const [updated] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return updated;
}

export async function deleteUserAndAuthTokensById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return false;
  }

  await db.delete(authTokens).where(eq(authTokens.userId, id));
  await db.delete(users).where(eq(users.id, id));
  return true;
}

export async function deleteExpiredUnverifiedUsers(cutoffDate: Date): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const staleUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.emailVerified, false),
        lt(users.createdAt, cutoffDate),
      ),
    )
    .limit(500);

  if (staleUsers.length === 0) {
    return 0;
  }

  const ids = staleUsers.map(row => row.id);
  await db.delete(authTokens).where(inArray(authTokens.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));
  return ids.length;
}

type CreateAuthTokenInput = Pick<
  InsertAuthToken,
  "userId" | "type" | "tokenHash" | "expiresAt"
>;

export async function createAuthToken(input: CreateAuthTokenInput) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create auth token: database not available");
    return undefined;
  }

  const [result] = await db.insert(authTokens).values(input);
  return Number((result as { insertId?: number }).insertId ?? 0) || undefined;
}

export async function getActiveAuthTokenByHash(input: {
  tokenHash: string;
  type: "email_verification" | "password_reset";
  now?: Date;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get auth token: database not available");
    return undefined;
  }

  const now = input.now ?? new Date();
  const result = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, input.tokenHash),
        eq(authTokens.type, input.type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, now),
      ),
    )
    .orderBy(desc(authTokens.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markAuthTokenUsed(id: number, usedAt: Date = new Date()) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update auth token: database not available");
    return;
  }

  await db.update(authTokens).set({ usedAt }).where(eq(authTokens.id, id));
}
