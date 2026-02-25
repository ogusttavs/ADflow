import { createHash, randomBytes } from "node:crypto";

export function createRawAuthToken(byteLength: number = 32): string {
  return randomBytes(byteLength).toString("hex");
}

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

