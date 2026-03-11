const encoder = new TextEncoder();

export type CallActionTokenPayload = {
  sessionId: string;
  receiverId: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSigningKey(secret: string) {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function createSignature(segment: string, secret: string): Promise<string> {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(segment));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export async function createCallActionToken(
  payload: CallActionTokenPayload,
  secret: string,
): Promise<string> {
  const segment = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await createSignature(segment, secret);
  return `${segment}.${signature}`;
}

export async function verifyCallActionToken(
  token: string,
  secret: string,
): Promise<CallActionTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [segment, signature] = parts;
  const expectedSignature = await createSignature(segment, secret);
  if (!timingSafeEquals(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(segment)));
    if (
      typeof payload?.sessionId !== "string" ||
      typeof payload?.receiverId !== "string" ||
      typeof payload?.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload as CallActionTokenPayload;
  } catch {
    return null;
  }
}
