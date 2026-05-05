export const demoModeMutationMessage =
  "DATABASE_URL is not configured. This preview is read-only demo data; configure Neon before saving real entries.";

export function assertPersistenceConfigured(isConfigured: boolean) {
  if (!isConfigured) {
    throw new Error(demoModeMutationMessage);
  }
}
