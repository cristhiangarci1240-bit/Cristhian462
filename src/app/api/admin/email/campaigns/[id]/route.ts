import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  bulkCreateCampaignRecipients,
  getCampaignRecipients,
  updateCampaignRecipient,
  isEmailOptedOut,
} from '@/lib/emailDb';
import { getClients } from '@/lib/db';
import { sendMail, buildUnsubscribeFooter } from '@/lib/mailService';
import { checkRateLimit, getClientIp } from '@/lib/security';
import type { CampaignRecipientFilter } from '@/lib/emailTypes';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tech7electronics.com';
const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';

// Batch settings
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 2000; // 2 seconds between batches

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveRecipients(filter: CampaignRecipientFilter) {
  const allClients = await getClients();
  let eligible = allClients.filter((c) => c.isActive);

  if (filter.type === 'selected' && filter.selectedIds?.length) {
    eligible = eligible.filter((c) => filter.selectedIds!.includes(c.id));
  } else if (filter.type === 'filtered') {
    if (filter.filterName) {
      const term = filter.filterName.toLowerCase();
      eligible = eligible.filter((c) => c.name.toLowerCase().includes(term));
    }
    if (filter.filterEmail) {
      const term = filter.filterEmail.toLowerCase();
      eligible = eligible.filter(
        (c) =>
          c.email?.toLowerCase().includes(term) ||
          c.website?.toLowerCase().includes(term) ||
          c.name.toLowerCase().includes(term)
      );
    }
  }

  return eligible;
}

// GET /api/admin/email/campaigns/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const includeRecipients = searchParams.get('recipients') === 'true';

    const campaign = await getCampaignById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });

    if (includeRecipients) {
      const recipients = await getCampaignRecipients(params.id);
      return NextResponse.json({ ...campaign, recipients });
    }

    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar campanha.' }, { status: 500 });
  }
}

// PUT /api/admin/email/campaigns/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const campaign = await getCampaignById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });

    if (!['draft', 'completed_with_errors'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Apenas campanhas em rascunho podem ser editadas.' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });

    const updated = await updateCampaign(params.id, {
      name: body.name ? String(body.name).slice(0, 200) : undefined,
      subject: body.subject ? String(body.subject).slice(0, 500) : undefined,
      bodyHtml: body.bodyHtml ? String(body.bodyHtml).slice(0, 500000) : undefined,
      bodyText: body.bodyText ? String(body.bodyText).slice(0, 100000) : undefined,
      senderName: body.senderName ? String(body.senderName).slice(0, 100) : undefined,
      recipientFilter: body.recipientFilter || undefined,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar campanha.' }, { status: 500 });
  }
}

// DELETE /api/admin/email/campaigns/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const campaign = await getCampaignById(params.id);
    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Não é possível excluir uma campanha em envio. Cancele primeiro.' },
        { status: 409 }
      );
    }

    await deleteCampaign(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir campanha.' }, { status: 500 });
  }
}

// POST /api/admin/email/campaigns/[id] with action query param
// action=preview-recipients | action=test | action=send | action=cancel
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json().catch(() => ({}));

  const campaign = await getCampaignById(params.id);
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });

  // ─── PREVIEW RECIPIENTS ───────────────────────────────
  if (action === 'preview-recipients') {
    try {
      const filter: CampaignRecipientFilter = body.recipientFilter || campaign.recipientFilter || { type: 'all' };
      const clients = await resolveRecipients(filter);

      const preview = await Promise.all(
        clients.map(async (c) => {
          const email =
            c.email ||
            (c.website ? `contato@${c.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : '');
          const optedOut = email ? await isEmailOptedOut(email) : false;
          return {
            id: c.id,
            name: c.name,
            email,
            website: c.website,
            optedOut,
          };
        })
      );

      return NextResponse.json({ count: preview.length, recipients: preview });
    } catch {
      return NextResponse.json({ error: 'Erro ao calcular destinatários.' }, { status: 500 });
    }
  }

  // ─── TEST EMAIL ───────────────────────────────────────
  if (action === 'test') {
    const testEmail = String(body.testEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!testEmail || !emailRegex.test(testEmail)) {
      return NextResponse.json({ error: 'E-mail de teste inválido.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, { keyPrefix: 'campaign_test', limit: 5, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitos e-mails de teste. Aguarde alguns instantes.' }, { status: 429 });
    }

    try {
      await sendMail({
        to: testEmail,
        subject: `[TESTE] ${campaign.subject}`,
        html: campaign.bodyHtml + '<p style="color:#94A3B8;font-size:12px;">[E-mail de teste — não é um envio real]</p>',
        text: campaign.bodyText,
      });
      return NextResponse.json({ success: true, message: `E-mail de teste enviado para ${testEmail}.` });
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Não foi possível enviar o e-mail de teste.' },
        { status: 503 }
      );
    }
  }

  // ─── CANCEL ───────────────────────────────────────────
  if (action === 'cancel') {
    if (!['sending', 'scheduled', 'draft'].includes(campaign.status)) {
      return NextResponse.json({ error: 'Esta campanha não pode ser cancelada.' }, { status: 409 });
    }
    await updateCampaign(params.id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  }

  // ─── SEND CAMPAIGN ────────────────────────────────────
  if (action === 'send') {
    if (!['draft', 'completed_with_errors'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Apenas campanhas em rascunho podem ser enviadas.' },
        { status: 409 }
      );
    }

    // Resolve recipients
    const clients = await resolveRecipients(campaign.recipientFilter);
    if (clients.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatário encontrado para esta campanha.' }, { status: 400 });
    }

    // Get existing recipients to prevent duplicates
    const existingRecipients = await getCampaignRecipients(params.id);
    const alreadySent = new Set(
      existingRecipients.filter((r) => r.status === 'sent').map((r) => r.email.toLowerCase())
    );

    // Filter out already-sent and opted-out
    const newRecipients = [];
    for (const client of clients) {
      const recipientEmail =
        client.email ||
        (client.website
          ? `contato@${client.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
          : '');
      if (!recipientEmail || alreadySent.has(recipientEmail.toLowerCase())) continue;
      const optedOut = await isEmailOptedOut(recipientEmail);
      if (optedOut) continue;
      newRecipients.push({
        campaignId: params.id,
        clientId: client.id,
        email: recipientEmail,
        name: client.name,
        status: 'pending' as const,
        retryCount: 0,
      });
    }

    await bulkCreateCampaignRecipients(newRecipients);
    await updateCampaign(params.id, {
      status: 'sending',
      totalRecipients: clients.length,
      sentAt: new Date().toISOString(),
    });

    // Respond immediately — sending runs asynchronously
    // (In production this should be a queue/worker; here we fire-and-forget)
    processCampaignQueue(params.id, campaign).catch((err) => {
      console.error('[Campaign Queue] Erro:', err?.message || err);
    });

    return NextResponse.json({
      success: true,
      message: `Envio iniciado para ${newRecipients.length} destinatários.`,
      totalRecipients: newRecipients.length,
    });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}

async function processCampaignQueue(campaignId: string, campaign: { subject: string; bodyHtml: string; bodyText?: string }) {
  const allRecipients = await getCampaignRecipients(campaignId);
  const pending = allRecipients.filter((r) => r.status === 'pending');

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    // Check if cancelled between batches
    const currentCampaign = await getCampaignById(campaignId);
    if (!currentCampaign || currentCampaign.status === 'cancelled') break;

    const batch = pending.slice(i, i + BATCH_SIZE);

    for (const recipient of batch) {
      try {
        const unsubscribeFooter = buildUnsubscribeFooter(recipient.email, campaignId, BASE_URL);
        await sendMail({
          to: recipient.email,
          subject: campaign.subject,
          html: campaign.bodyHtml + unsubscribeFooter,
          text: campaign.bodyText,
          headers: {
            'List-Unsubscribe': `<${BASE_URL}/api/admin/email/unsubscribe?email=${encodeURIComponent(recipient.email)}>`,
          },
        });

        await updateCampaignRecipient(recipient.id, {
          status: 'sent',
          sentAt: new Date().toISOString(),
        });
        sentCount++;
      } catch (err: any) {
        await updateCampaignRecipient(recipient.id, {
          status: 'failed',
          errorMessage: String(err?.message || 'Erro desconhecido').slice(0, 500),
          retryCount: (recipient.retryCount || 0) + 1,
        });
        failedCount++;
      }
    }

    if (i + BATCH_SIZE < pending.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  const finalStatus = failedCount > 0 && sentCount === 0
    ? 'completed_with_errors'
    : failedCount > 0
    ? 'completed_with_errors'
    : 'completed';

  await updateCampaign(campaignId, {
    status: finalStatus,
    sentCount,
    failedCount,
  });
}
