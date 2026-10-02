import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import {
  getCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  bulkCreateCampaignRecipients,
  getCampaignRecipients,
  isEmailOptedOut,
} from '@/lib/emailDb';
import { getClients } from '@/lib/db';
import { sendMail, buildUnsubscribeFooter } from '@/lib/mailService';
import { checkRateLimit, getClientIp } from '@/lib/security';
import type { CampaignRecipientFilter, CampaignRecipient } from '@/lib/emailTypes';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tech7electronics.com';
const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';

// ─── LIST / CREATE CAMPAIGNS ─────────────────────────────

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json({ error: 'Erro ao listar campanhas.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.subject || !body.bodyHtml) {
      return NextResponse.json(
        { error: 'Nome, assunto e corpo da campanha são obrigatórios.' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      name: String(body.name).slice(0, 200),
      senderEmail: MAIL_USER,
      senderName: String(body.senderName || 'TECH7 Electronics').slice(0, 100),
      subject: String(body.subject).slice(0, 500),
      bodyHtml: String(body.bodyHtml).slice(0, 500000),
      bodyText: body.bodyText ? String(body.bodyText).slice(0, 100000) : undefined,
      status: 'draft',
      recipientFilter: body.recipientFilter || { type: 'all' },
      totalRecipients: 0,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar campanha.' }, { status: 500 });
  }
}
