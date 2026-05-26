import assert from "node:assert/strict";
import test from "node:test";

import { isEmailAllowed } from "../lib/auth/email.ts";

test("email allowlist supports exact normalized addresses", () => {
  withAllowedEmails("leo@example.com, friend@example.com", () => {
    assert.equal(isEmailAllowed("Friend@Example.com"), true);
    assert.equal(isEmailAllowed("other@example.com"), false);
  });
});

test("empty allowlist remains open for email login but fail-closed callers stay closed", () => {
  withAllowedEmails(undefined, () => {
    assert.equal(isEmailAllowed("anyone@example.com"), true);
    assert.equal(isEmailAllowed("anyone@example.com", { failClosed: true }), false);
  });
});

test("wildcard allowlist opens both regular and fail-closed checks", () => {
  withAllowedEmails("*", () => {
    assert.equal(isEmailAllowed("anyone@example.com"), true);
    assert.equal(isEmailAllowed("anyone@example.com", { failClosed: true }), true);
  });
});

function withAllowedEmails(value: string | undefined, callback: () => void) {
  const original = process.env.APP_ALLOWED_EMAILS;

  try {
    if (value === undefined) {
      delete process.env.APP_ALLOWED_EMAILS;
    } else {
      process.env.APP_ALLOWED_EMAILS = value;
    }

    callback();
  } finally {
    if (original === undefined) {
      delete process.env.APP_ALLOWED_EMAILS;
    } else {
      process.env.APP_ALLOWED_EMAILS = original;
    }
  }
}
