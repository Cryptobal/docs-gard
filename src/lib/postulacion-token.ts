import crypto from "node:crypto";

const FALLBACK_TOKEN = "opai-postulacion-2026";

export function getPostulacionToken(): string {
  return process.env.OPAI_POSTULACION_TOKEN?.trim() || FALLBACK_TOKEN;
}

export function isValidPostulacionToken(token: string): boolean {
  const expected = getPostulacionToken();
  const given = (token || "").trim();
  if (!given) return false;

  const expectedBuffer = Buffer.from(expected);
  const givenBuffer = Buffer.from(given);
  if (expectedBuffer.length !== givenBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, givenBuffer);
}

export function buildPostulacionPublicPath(token: string): string {
  return `/postulacion/${encodeURIComponent(token)}`;
}
