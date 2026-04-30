import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. The app can run with mock data for now.");
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
