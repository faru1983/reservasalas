import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-agenda-key-change-in-prod-2026';
const COOKIE_NAME = 'auth_session';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export function signJwt(payload: SessionPayload, expiresInDays = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  const fullPayload = { ...payload, exp };

  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64UrlPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest('base64url');

  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}

export function verifyJwt(token: string): (SessionPayload & { exp: number }) | null {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Token has expired
    }

    return payload as SessionPayload & { exp: number };
  } catch {
    return null;
  }
}

// Extract session helper for APIs
export function getSession(req: NextRequest): SessionPayload | null {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) return null;
  return verifyJwt(cookie.value);
}

// Require role checks
export function checkRole(req: NextRequest, allowedRoles: UserRole[]): SessionPayload | null {
  const session = getSession(req);
  if (!session) return null;
  if (!allowedRoles.includes(session.role)) return null;
  return session;
}

export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie) return null;
    return verifyJwt(cookie.value);
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
