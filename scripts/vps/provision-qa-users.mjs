#!/usr/bin/env node

import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

const PLAN_USERS = [
  {
    plan: "personal_standard",
    alias: "orbita-personal-standard",
    firstName: "QA",
    lastName: "Personal Standard",
    whatsapp: "+5511990001001",
  },
  {
    plan: "personal_pro",
    alias: "orbita-personal-pro",
    firstName: "QA",
    lastName: "Personal Pro",
    whatsapp: "+5511990001002",
  },
  {
    plan: "business_standard",
    alias: "orbita-business-standard",
    firstName: "QA",
    lastName: "Business Standard",
    whatsapp: "+5511990001003",
  },
  {
    plan: "business_pro",
    alias: "orbita-business-pro",
    firstName: "QA",
    lastName: "Business Pro",
    whatsapp: "+5511990001004",
  },
];

function readOption(name) {
  const flag = `--${name}`;
  const argv = process.argv.slice(2);
  const index = argv.indexOf(flag);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

function buildTaggedEmail(baseEmail, alias) {
  const trimmed = String(baseEmail ?? "").trim().toLowerCase();
  const [localPart, domain] = trimmed.split("@");
  if (!localPart || !domain) {
    throw new Error("Base email invalido. Use um email real no formato nome@dominio.com.");
  }

  const rootLocalPart = localPart.split("+")[0];
  return `${rootLocalPart}+${alias}@${domain}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const baseEmail =
    readOption("base-email") ||
    process.env.QA_USERS_BASE_EMAIL ||
    process.env.OWNER_QA_BASE_EMAIL;
  const password = readOption("password") || process.env.QA_USERS_PASSWORD;
  const expiryDays = Number(readOption("expiry-days") || process.env.QA_USERS_EXPIRY_DAYS || 365);

  if (!databaseUrl) {
    throw new Error("DATABASE_URL ausente.");
  }
  if (!baseEmail) {
    throw new Error("Informe --base-email ou QA_USERS_BASE_EMAIL.");
  }
  if (!password) {
    throw new Error("Informe --password ou QA_USERS_PASSWORD.");
  }
  if (!Number.isFinite(expiryDays) || expiryDays < 1) {
    throw new Error("expiry-days invalido.");
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    for (const planUser of PLAN_USERS) {
      const email = buildTaggedEmail(baseEmail, planUser.alias);
      const fullName = `${planUser.firstName} ${planUser.lastName}`.trim();
      const [existingRows] = await connection.execute(
        "SELECT id, openId FROM users WHERE email = ? ORDER BY id DESC LIMIT 1",
        [email],
      );
      const existing = Array.isArray(existingRows) ? existingRows[0] : null;

      if (existing && typeof existing === "object" && "id" in existing) {
        await connection.execute(
          `UPDATE users
             SET name = ?,
                 firstName = ?,
                 lastName = ?,
                 whatsapp = ?,
                 city = ?,
                 address = ?,
                 acquisitionSource = ?,
                 preferredLanguage = ?,
                 marketingOptIn = ?,
                 passwordHash = ?,
                 emailVerified = ?,
                 emailVerifiedAt = NOW(),
                 loginMethod = ?,
                 role = ?,
                 plan = ?,
                 planStatus = ?,
                 planExpiry = DATE_ADD(NOW(), INTERVAL ? DAY),
                 lastSignedIn = NOW()
           WHERE id = ?`,
          [
            fullName,
            planUser.firstName,
            planUser.lastName,
            planUser.whatsapp,
            "Sao Paulo",
            "Conta QA provisionada para validacao interna",
            "Provisionamento QA",
            "Portugues (Brasil)",
            0,
            passwordHash,
            1,
            "email",
            "user",
            planUser.plan,
            "active",
            expiryDays,
            existing.id,
          ],
        );
        console.log(`[updated] ${planUser.plan} -> ${email}`);
        continue;
      }

      const openId = `qa_${planUser.plan}_${randomUUID().slice(0, 8)}`;
      await connection.execute(
        `INSERT INTO users (
           openId,
           name,
           firstName,
           lastName,
           email,
           whatsapp,
           city,
           address,
           acquisitionSource,
           preferredLanguage,
           marketingOptIn,
           passwordHash,
           emailVerified,
           emailVerifiedAt,
           loginMethod,
           role,
           plan,
           planStatus,
           planExpiry,
           createdAt,
           updatedAt,
           lastSignedIn
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), NOW(), NOW(), NOW())`,
        [
          openId,
          fullName,
          planUser.firstName,
          planUser.lastName,
          email,
          planUser.whatsapp,
          "Sao Paulo",
          "Conta QA provisionada para validacao interna",
          "Provisionamento QA",
          "Portugues (Brasil)",
          0,
          passwordHash,
          1,
          "email",
          "user",
          planUser.plan,
          "active",
          expiryDays,
        ],
      );
      console.log(`[created] ${planUser.plan} -> ${email}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[provision-qa-users] erro:", error instanceof Error ? error.message : error);
  process.exit(1);
});
