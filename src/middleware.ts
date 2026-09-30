import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tech7-enterprise-ultra-secure-secret-key-2026'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('tech7_auth_token')?.value;
  let sessionPayload = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionPayload = payload;
    } catch {
      sessionPayload = null;
    }
  }

  // Se já estiver logado e tentar acessar /admin/login, redirecionar para /admin
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    if (sessionPayload) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida de administração
  if (pathname.startsWith('/admin')) {
    if (!sessionPayload) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (token) {
        res.cookies.delete('tech7_auth_token');
      }
      return res;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
