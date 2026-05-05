import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import {
  assertPersistenceConfigured,
  demoModeMutationMessage
} from "@/lib/runtime/persistence-mode";
import * as schema from "@/lib/db/schema";

export { demoModeMutationMessage };

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function assertDbConfiguredForMutation() {
  assertPersistenceConfigured(isDbConfigured());
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(demoModeMutationMessage);
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
