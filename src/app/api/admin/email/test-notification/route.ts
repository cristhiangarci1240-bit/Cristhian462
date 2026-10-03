import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailService';
import { checkRateLimit, getClientIp } from '@/lib/security';

const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  const rate = checkRateLimit(`${clientIp}:${session.userId}`, {
    keyPrefix: 'email_test_notify',
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas de teste em pouco tempo. Aguarde um minuto.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const recipientEmail = String(body.recipientEmail || '').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Informe um endereço de e-mail válido para teste.' },
        { status: 400 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://tech7electronics.com'
    ).replace(/\/+$/, '');

    const testHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.04);">
        <div style="background:#0F172A;padding:20px 24px;border-bottom:3px solid #008744;">
          <h2 style="color:#FFFFFF;margin:0;font-size:18px;font-weight:700;">TECH7 Electronics — Teste de Notificação</h2>
          <p style="color:#94A3B8;margin:4px 0 0 0;font-size:12px;">Verificação do canal de alertas</p>
        </div>
        <div style="padding:24px;">
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#166534;font-weight:600;">✓ Notificação enviada com sucesso.</p>
            <p style="margin:0;font-size:13px;color:#334155;line-height:1.5;">
              Este é um e-mail de teste disparado pelo Painel Administrativo da TECH7 Electronics para confirmar que a sua conta de notificações está devidamente configurada e recebendo alertas.
            </p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="${appUrl}/admin/email" style="display:inline-block;background:#008744;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:700;font-size:14px;">
              Abrir no Painel
            </a>
          </div>
        </div>
        <div style="background:#F1F5F9;padding:12px 24px;text-align:center;font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;">
          E-mail de teste gerado pelo sistema corporativo da TECH7 Electronics.
        </div>
      </div>
    `;

    await sendMail({
      to: recipientEmail,
      subject: 'Teste de Notificação - TECH7 Electronics',
      html: testHtml,
      text: `Teste de Notificação - TECH7 Electronics\n\nNotificação enviada com sucesso.\nO canal de alertas para o e-mail ${recipientEmail} está ativo.\n\nAbrir no Painel: ${appUrl}/admin/email`,
    });

    try {
      const { recordNotificationLog } = await import('@/lib/emailDb');
      await recordNotificationLog({
        recipientEmail,
        uid: 0,
        messageId: `test_${Date.now()}`,
        subject: 'Teste de Notificação - TECH7 Electronics',
        from: `TECH7 Electronics <${MAIL_USER}>`,
        status: 'success',
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação enviada com sucesso.',
    });
  } catch (error: any) {
    console.error('[Test Notification] Erro ao enviar:', error?.message || error);
    try {
      const { recordNotificationLog } = await import('@/lib/emailDb');
      const body = await request.clone().json().catch(() => ({}));
      const rec = String(body.recipientEmail || '').trim();
      if (rec) {
        await recordNotificationLog({
          recipientEmail: rec,
          uid: 0,
          messageId: `test_${Date.now()}`,
          subject: 'Teste de Notificação - TECH7 Electronics',
          from: `TECH7 Electronics <${MAIL_USER}>`,
          status: 'failed',
          error: error?.message || 'Falha na conexão SMTP com o servidor.',
        });
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json(
      { error: error?.message ? `Erro SMTP: ${error.message}` : 'Não foi possível enviar a notificação. Verifique a configuração SMTP.' },
      { status: 503 }
    );
  }
}
