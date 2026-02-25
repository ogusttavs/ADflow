import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ENV } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const ENCRYPTION_VERSION = "profile_v1";

let cachedKey: Buffer | null = null;

function decodeEncryptionKey(rawKey: string): Buffer {
  const normalized = rawKey.trim();
  if (!normalized) {
    throw new Error("USER_PII_ENCRYPTION_KEY não configurada");
  }

  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    key = Buffer.from(normalized, "hex");
  } else {
    key = Buffer.from(normalized, "base64");
  }

  if (key.byteLength !== 32) {
    throw new Error("USER_PII_ENCRYPTION_KEY deve ter 32 bytes (hex ou base64)");
  }

  return key;
}

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  cachedKey = decodeEncryptionKey(ENV.userPiiEncryptionKey);
  return cachedKey;
}

export function encryptProfileSensitiveValue(value: string): string {
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptProfileSensitiveValue(encryptedValue: string): string {
  const [version, ivEncoded, tagEncoded, encryptedEncoded] = encryptedValue.split(":");

  if (
    version !== ENCRYPTION_VERSION ||
    !ivEncoded ||
    !tagEncoded ||
    !encryptedEncoded
  ) {
    throw new Error("Formato de dado sensível inválido");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

