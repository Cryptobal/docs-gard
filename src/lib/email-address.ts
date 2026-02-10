const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function normalizeEmailAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function extractEmailAddresses(value?: string | null): string[] {
  if (!value) return [];

  const matches = value.match(EMAIL_REGEX) || [];
  const normalized = matches
    .map((match) => normalizeEmailAddress(match))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

export function normalizeEmailList(values?: string[] | null): string[] {
  if (!values?.length) return [];

  const normalized: string[] = [];

  for (const value of values) {
    const extracted = extractEmailAddresses(value);
    if (extracted.length > 0) {
      normalized.push(...extracted);
      continue;
    }

    const fallback = normalizeEmailAddress(value);
    if (fallback) {
      normalized.push(fallback);
    }
  }

  return Array.from(new Set(normalized));
}
