import assert from "node:assert/strict";
import test from "node:test";

import { sendEmail } from "../lib/email/resend.ts";

test("sendEmail degrades when provider variables are missing", async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  const originalFetch = globalThis.fetch;

  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    globalThis.fetch = (async () => {
      throw new Error("fetch should not be called");
    }) as typeof fetch;

    const result = await sendEmail(emailInput);

    assert.equal(result.sent, false);
    assert.match(result.reason, /not configured/i);
  } finally {
    restoreEnv("RESEND_API_KEY", originalApiKey);
    restoreEnv("EMAIL_FROM", originalFrom);
    globalThis.fetch = originalFetch;
  }
});

test("sendEmail returns a structured failure on provider errors", async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  const originalFetch = globalThis.fetch;

  try {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "FolioCore <test@example.com>";
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    const result = await sendEmail(emailInput);

    assert.equal(result.sent, false);
    assert.match(result.reason, /failed|timed out/i);
  } finally {
    restoreEnv("RESEND_API_KEY", originalApiKey);
    restoreEnv("EMAIL_FROM", originalFrom);
    globalThis.fetch = originalFetch;
  }
});

test("sendEmail passes through provider error messages", async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  const originalFetch = globalThis.fetch;

  try {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "FolioCore <test@example.com>";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: "Invalid sender" }), { status: 400 })) as typeof fetch;

    const result = await sendEmail(emailInput);

    assert.equal(result.sent, false);
    assert.match(result.reason, /Invalid sender/);
  } finally {
    restoreEnv("RESEND_API_KEY", originalApiKey);
    restoreEnv("EMAIL_FROM", originalFrom);
    globalThis.fetch = originalFetch;
  }
});

const emailInput = {
  to: "leopoldjourdain@gmail.com",
  subject: "Digest",
  html: "<p>Hello</p>",
  text: "Hello"
};

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
