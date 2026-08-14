import { OwnerTokenItem } from "./types";

const STORAGE_KEY = "bottari_owner_tokens";

export function getOwnerTokens(): OwnerTokenItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OwnerTokenItem[];
  } catch {
    return [];
  }
}

export function saveOwnerToken(slug: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    const tokens = getOwnerTokens().filter((item) => item.slug !== slug);
    tokens.unshift({ slug, token, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.error("Failed to save owner token to localStorage:", err);
  }
}

export function hasOwnerToken(slug: string): boolean {
  return getOwnerTokens().some((item) => item.slug === slug);
}

export function removeOwnerTokens(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    const remaining = getOwnerTokens().filter((item) => !slugs.includes(item.slug));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error("Failed to clean owner tokens:", err);
  }
}
