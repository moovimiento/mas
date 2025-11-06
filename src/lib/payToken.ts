import crypto from 'crypto';

const ALG = 'sha256';

function base64url(input: Buffer) {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function createPayToken(orderId: string, ttlHours = 72) {
  const secret = process.env.PAYMENT_TOKEN_SECRET || process.env.MERCADOPAGO_ACCESS_TOKEN || 'dev-secret';
  const exp = Math.floor(Date.now() / 1000) + ttlHours * 3600;
  const payload = JSON.stringify({ orderId, exp });
  const payloadB = Buffer.from(payload, 'utf8');
  const sig = crypto.createHmac(ALG, secret).update(payloadB).digest();
  return `${base64url(payloadB)}.${base64url(sig)}`;
}

export function verifyPayToken(token: string) {
  try {
    const secret = process.env.PAYMENT_TOKEN_SECRET || process.env.MERCADOPAGO_ACCESS_TOKEN || 'dev-secret';
    const [payloadPart, sigPart] = token.split('.');
    if (!payloadPart || !sigPart) return null;
    const payloadB = base64urlDecode(payloadPart);
    const expectedSig = crypto.createHmac(ALG, secret).update(payloadB).digest();
    const sigB = base64urlDecode(sigPart);
    if (!crypto.timingSafeEqual(expectedSig, sigB)) return null;
    const payload = JSON.parse(payloadB.toString('utf8')) as { orderId: string; exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
