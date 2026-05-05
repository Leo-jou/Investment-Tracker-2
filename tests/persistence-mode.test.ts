import assert from "node:assert/strict";
import test from "node:test";

import {
  assertPersistenceConfigured,
  demoModeMutationMessage
} from "../lib/runtime/persistence-mode.ts";

test("mutation guard fails closed when DATABASE_URL is missing", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    assert.throws(() => assertPersistenceConfigured(Boolean(process.env.DATABASE_URL)), {
      message: demoModeMutationMessage
    });
  } finally {
    restoreDatabaseUrl(originalDatabaseUrl);
  }
});

test("mutation guard allows writes when DATABASE_URL is configured", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://example.local/test";

  try {
    assert.doesNotThrow(() => assertPersistenceConfigured(Boolean(process.env.DATABASE_URL)));
  } finally {
    restoreDatabaseUrl(originalDatabaseUrl);
  }
});

function restoreDatabaseUrl(value: string | undefined) {
  if (value === undefined) {
    delete process.env.DATABASE_URL;
    return;
  }

  process.env.DATABASE_URL = value;
}
