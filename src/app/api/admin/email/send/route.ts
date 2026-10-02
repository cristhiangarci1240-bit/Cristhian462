import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { sendMail } from '@/lib/mailService';
import { checkRateLimit, getClientIp } from '@/lib/security';

const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';

function sanitizeSubject(subject: string): string {
  // Prevent header injection: strip CRLF
  return subject.replace(/[\r\n]/g, ' ').slice(0, 500).trim();
}

function sanitizeAddress(addr: string): string {
  return addr.replace(/[\r\n]/g, '').slice(0, 320).trim();
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:${session.userId}`, {
    keyPrefix: 'email_send',
    limit: 20,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Limite de envios por minuto atingido. Aguarde alguns instantes.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const to = sanitizeAddress(String(body.to || ''));
    const subject = sanitizeSubject(String(body.subject || ''));
    const html = String(body.html || body.bodyHtml || '');
    const text = String(body.text || '');
    const cc = body.cc ? sanitizeAddress(String(body.cc)) : undefined;
    const bcc = body.bcc ? sanitizeAddress(String(body.bcc)) : undefined;
    const inReplyTo = body.inReplyTo ? String(body.inReplyTo).slice(0, 500) : undefined;
    const references = body.references ? String(body.references).slice(0, 1000) : undefined;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Destinatário, assunto e corpo são obrigatórios.' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = to.split(',').map((e) => e.trim());
    for (const addr of toEmails) {
      if (addr && !emailRegex.test(addr)) {
        return NextResponse.json(
          { error: `Endereço de e-mail inválido: ${addr}` },
          { status: 400 }
        );
      }
    }

    await sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      replyTo: MAIL_USER,
      inReplyTo,
      references,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Email Send] Erro:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível enviar o e-mail. Verifique as configurações do servidor de e-mail.' },
      { status: 503 }
    );
  }
}
