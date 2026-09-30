import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { signToken, verifyPassword, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, resetRateLimit, getClientIp, DUMMY_HASH, logSecurityEvent } from '@/lib/security';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  // 1. Rate Limiting: Max 5 failed attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(clientIp, {
    keyPrefix: 'login_attempts',
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_TRIGGERED',
      ip: clientIp,
      details: { endpoint: '/api/auth/login', retryAfter: rateLimit.retryAfterSeconds },
    });

    return NextResponse.json(
      {
        error: `Muitas tentativas incorretas de login. Por segurança, tente novamente em ${Math.ceil(
          (rateLimit.retryAfterSeconds || 60) / 60
        )} minuto(s).`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds || 900),
        },
      }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    // Limit input length to prevent CPU exhaustion on bcrypt
    if (email.length > 150 || password.length > 128) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    // Constant-time mitigation against timing attacks:
    // If the user does not exist, run verifyPassword with DUMMY_HASH so the execution time is identical
    const passwordHash = user ? user.passwordHash : DUMMY_HASH;
    const isValid = await verifyPassword(password, passwordHash);

    if (!user || !isValid) {
      logSecurityEvent({
        type: 'LOGIN_FAILED',
        ip: clientIp,
        userEmail: email,
      });

      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Login successful: reset rate limit attempts for this IP
    resetRateLimit('login_attempts', clientIp);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      ip: clientIp,
      userEmail: user.email,
      userId: user.id,
      details: { role: user.role },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    // Never expose stack traces or internal errors to client
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a autenticação. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
