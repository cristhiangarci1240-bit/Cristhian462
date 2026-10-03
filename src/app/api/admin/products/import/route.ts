import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { checkRateLimit, getClientIp, logSecurityEvent } from '@/lib/security';
import { detectAndFetchMarketplaceProduct } from '@/lib/marketplaces/marketplaceService';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  if (!isUserAdmin(session.role)) {
    logSecurityEvent({
      type: 'FORBIDDEN_ACTION_ATTEMPT',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { action: 'POST /api/admin/products/import', role: session.role },
    });
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem importar produtos.' },
      { status: 403 }
    );
  }

  // Rate limiting: 20 product imports per minute
  const rateLimit = checkRateLimit(`${clientIp}:${session.userId}`, {
    keyPrefix: 'marketplace_import',
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas de importação. Aguarde alguns instantes.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.url) {
      return NextResponse.json({ error: 'URL do produto é obrigatória.' }, { status: 400 });
    }

    const url = String(body.url).trim();
    const result = await detectAndFetchMarketplaceProduct(url);

    return NextResponse.json({
      success: true,
      data: result,
      product: result.product,
      duplicateMatch: result.duplicateMatch,
      suggestedCategoryId: result.suggestedCategoryId,
      isManualMode: result.isManualMode,
      notice: result.notice,
    });
  } catch (error: any) {
    const message = error?.message || 'Não foi possível consultar o marketplace.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
