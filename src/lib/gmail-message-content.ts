export type GmailMessagePart = {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailMessagePart[] | null;
};

export function decodeBase64Url(value?: string | null): string {
  if (!value) return "";

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);

  try {
    return Buffer.from(`${base64}${padding}`, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export function extractGmailMessageBodies(payload?: GmailMessagePart): {
  htmlBody: string | null;
  textBody: string | null;
} {
  if (!payload) return { htmlBody: null, textBody: null };

  let htmlBody: string | null = null;
  let textBody: string | null = null;
  const stack: GmailMessagePart[] = [payload];

  while (stack.length > 0) {
    const part = stack.pop();
    if (!part) continue;

    const mimeType = (part.mimeType || "").toLowerCase();
    const decoded = decodeBase64Url(part.body?.data);

    if (decoded) {
      if (!htmlBody && mimeType.includes("text/html")) {
        htmlBody = decoded;
      }
      if (!textBody && mimeType.includes("text/plain")) {
        textBody = decoded;
      }
    }

    if (part.parts?.length) {
      stack.push(...part.parts);
    }
  }

  return { htmlBody, textBody };
}
