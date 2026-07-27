const TOKEN_BYTE_LENGTH = 32;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Generates a 256-bit CSPRNG token. Only `hash` is ever persisted; `raw` is shown once. */
export async function generateShareToken(): Promise<{ raw: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTE_LENGTH));
  const raw = toBase64Url(bytes);
  const hash = await hashShareToken(raw);

  return { raw, hash };
}

export async function hashShareToken(raw: string): Promise<string> {
  return sha256Hex(raw);
}

/** Constant-time comparison to avoid a timing oracle on hash lookups. */
export function verifyTokenConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}
