import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { logSecurityEvent, getClientIp } from '@/lib/security';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (session) {
    logSecurityEvent({
      type: 'LOGOUT',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
