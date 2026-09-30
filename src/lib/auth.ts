import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tech7-enterprise-ultra-secure-secret-key-2026'
);

export const AUTH_COOKIE_NAME = 'tech7_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function getSessionUser(cookieHeader?: string | null): Promise<TokenPayload | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  return verifyToken(token);
}

export function isUserAdmin(role?: string): boolean {
  return role?.toUpperCase() === 'ADMIN' || role?.toUpperCase() === 'ADMINISTRADOR';
}
