export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isEmailAllowed(email: string, options: { failClosed?: boolean } = {}) {
  const allowed = (process.env.APP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

  if (allowed.length === 0) return !options.failClosed;
  return allowed.includes(normalizeEmail(email));
}
