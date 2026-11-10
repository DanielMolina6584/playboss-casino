// TOTP RFC 6238 (SHA1, 6 dígitos, 30 s) con Web Crypto. Solo lo usa el modo
// mock para simular al servidor y mostrar el código vigente en demostración.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_PERIOD = 30;

export function randomBase32Secret(bytes = 20): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  let bits = '';
  raw.forEach((b) => (bits += b.toString(2).padStart(8, '0')));
  return (bits.match(/.{1,5}/g) ?? []).map((c) => ALPHABET[parseInt(c.padEnd(5, '0'), 2)]).join('');
}

function base32Decode(s: string) {
  let bits = '';
  for (const c of s.toUpperCase().replace(/[=\s-]/g, '')) bits += ALPHABET.indexOf(c).toString(2).padStart(5, '0');
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(out);
}

export const totpCounter = (nowMs = Date.now()) => Math.floor(nowMs / 1000 / TOTP_PERIOD);

export async function hotp(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', base32Decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const msg = new DataView(new ArrayBuffer(8));
  msg.setUint32(0, Math.floor(counter / 2 ** 32));
  msg.setUint32(4, counter >>> 0);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg.buffer));
  const o = h[19] & 0x0f;
  const n = (((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000;
  return String(n).padStart(6, '0');
}

export async function currentTotp(secret: string): Promise<string> {
  return hotp(secret, totpCounter());
}

/** Devuelve el contador que coincide (±1 ventana) y es mayor que el último usado, o null. */
export async function verifyTotp(secret: string, code: string, lastCounter: number | null): Promise<number | null> {
  if (!/^\d{6}$/.test(code)) return null;
  const now = totpCounter();
  let hit: number | null = null;
  for (const c of [now - 1, now, now + 1]) {
    if ((await hotp(secret, c)) === code && (lastCounter === null || c > lastCounter)) hit = c;
  }
  return hit;
}
