import { mockUser } from "@/lib/mock-data";

export function getCurrentUser() {
  return mockUser;
}

export function isSingleUserMode() {
  return true;
}
