import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

export const demoModeMutationMessage =
  "DATABASE_URL is not configured. This preview is read-only demo data; configure Neon before saving real entries.";

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function assertDbConfiguredForMutation() {
  if (!isDbConfigured()) {
    throw new Error(demoModeMutationMessage);
  }
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(demoModeMutationMessage);
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
