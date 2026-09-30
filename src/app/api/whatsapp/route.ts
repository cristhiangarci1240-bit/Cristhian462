import { NextResponse } from 'next/server';
import { recordWhatsAppClick, getWhatsAppInquiries } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  // Rate limiting: max 15 requests per minute per IP to protect database from flooding
  const rateLimit = checkRateLimit(clientIp, {
    keyPrefix: 'whatsapp_click',
    limit: 15,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Muitas requisições. Aguarde um instante.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 300);

    const safeProductId = body.productId ? String(body.productId).slice(0, 100).trim() : undefined;
    const safeProductName = body.productName ? String(body.productName).slice(0, 200).trim() : undefined;

    const inquiry = await recordWhatsAppClick(
      safeProductId,
      safeProductName,
      clientIp,
      userAgent
    );

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao registrar solicitação.' }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const inquiries = await getWhatsAppInquiries();
  return NextResponse.json(inquiries);
}
