import { NextResponse } from 'next/server';
import { addEmailOptOut } from '@/lib/emailDb';

/**
 * Public unsubscribe endpoint — no auth required (email links).
 * Token = base64url of "email:campaignId"
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    let email = '';

    if (tokenParam) {
      try {
        const decoded = Buffer.from(tokenParam, 'base64url').toString('utf-8');
        email = decoded.split(':')[0] || '';
      } catch {
        // fall through
      }
    } else if (emailParam) {
      email = emailParam;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        buildHtmlPage('Link inválido', 'O link de cancelamento de inscrição é inválido ou expirou.'),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    await addEmailOptOut(email.toLowerCase(), 'Cancelamento via link de e-mail');

    return new Response(
      buildHtmlPage(
        'Cancelamento confirmado',
        `O endereço <strong>${email}</strong> foi removido da nossa lista de e-mails de marketing.`
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch {
    return new Response(
      buildHtmlPage('Erro', 'Não foi possível processar o cancelamento. Tente novamente.'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

function buildHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — TECH7 Electronics</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #F8FAFC; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 40px 48px; max-width: 480px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    h1 { font-size: 22px; color: #0F172A; margin-bottom: 16px; }
    p { color: #64748B; font-size: 15px; line-height: 1.6; }
    a { color: #00E676; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top:24px;"><a href="https://tech7electronics.com">← Voltar ao site</a></p>
  </div>
</body>
</html>`;
}
