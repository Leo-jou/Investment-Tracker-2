export function isGoogleLoginConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID) && Boolean(process.env.AUTH_GOOGLE_SECRET);
}
