import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { logSecurityEvent, getClientIp } from '@/lib/security';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const clientIp = getClientIp(request);

  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // Apenas Administradores podem atualizar as configurações gerais da empresa
  if (!isUserAdmin(session.role)) {
    logSecurityEvent({
      type: 'FORBIDDEN_ACTION_ATTEMPT',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { action: 'PUT /api/settings', role: session.role },
    });
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores têm permissão para alterar as configurações do sistema.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    // Sanitize string lengths and prevent unexpected fields
    const safePayload: Record<string, any> = {};
    const allowedFields = [
      'logoUrl',
      'logoMobileUrl',
      'loginLogoUrl',
      'faviconUrl',
      'primaryColor',
      'secondaryColor',
      'heroTitle',
      'heroSubtitle',
      'heroBadge',
      'heroImage',
      'whatsappNumber',
      'whatsappDefaultMessage',
      'whatsappProductMessage',
      'contactEmail',
      'contactPhone',
      'address',
      'linkedinUrl',
      'instagramUrl',
      'partnersTitle',
      'partnersTitleAccent',
      'partnersSubtitle',
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (typeof body[key] === 'string') {
          safePayload[key] = body[key].slice(0, 1000).trim();
        }
      }
    }

    // Logos do carrossel "Empresas com quem trabalhamos"
    if (Array.isArray(body.partners)) {
      safePayload.partners = body.partners
        .filter((p: any) => p && typeof p.name === 'string' && p.name.trim())
        .slice(0, 50)
        .map((p: any) => ({
          name: p.name.slice(0, 120).trim(),
          logo: typeof p.logo === 'string' ? p.logo.slice(0, 1000).trim() : '',
          website: typeof p.website === 'string' && p.website.trim() ? p.website.slice(0, 1000).trim() : undefined,
        }));
    }

    const updated = await updateSettings(safePayload);

    logSecurityEvent({
      type: 'SETTINGS_UPDATED',
      ip: clientIp,
      userId: session.userId,
      userEmail: session.email,
      details: { updatedKeys: Object.keys(safePayload) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar configurações.' }, { status: 500 });
  }
}
