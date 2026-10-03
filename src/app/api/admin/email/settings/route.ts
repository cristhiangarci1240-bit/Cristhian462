import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE_NAME, isUserAdmin } from '@/lib/auth';
import { getEmailSettings, updateEmailSettings } from '@/lib/emailDb';
import { restartEmailBackgroundMonitor, checkAndNotifyNewEmails } from '@/lib/emailMonitor';

const MAIL_USER = process.env.MAIL_USER || 'comercial@tech7electronics.com';
const MAIL_PASSWORD = process.env.MAIL_PASSWORD || '';
const MAIL_IMAP_HOST = process.env.MAIL_IMAP_HOST || 'imap.hostinger.com';
const MAIL_SMTP_HOST = process.env.MAIL_SMTP_HOST || 'smtp.hostinger.com';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const settings = await getEmailSettings();

    // Check configuration status without exposing sensitive credentials
    let accountStatus: 'connected' | 'not_configured' | 'error' = 'not_configured';
    if (!MAIL_PASSWORD) {
      accountStatus = 'not_configured';
    } else {
      accountStatus = 'connected';
    }

    return NextResponse.json({
      settings,
      account: {
        user: MAIL_USER,
        status: accountStatus,
        imapHost: MAIL_IMAP_HOST,
        smtpHost: MAIL_SMTP_HOST,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Não foi possível carregar as configurações de e-mail.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || !isUserAdmin(session.role)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const previousSettings = await getEmailSettings();
    const updated = await updateEmailSettings(body);

    // If interval changed or notification settings updated, restart/trigger background monitor
    const prevInterval = previousSettings.notifications?.checkIntervalMinutes || 2;
    const newInterval = updated.notifications?.checkIntervalMinutes || 2;
    if (prevInterval !== newInterval) {
      restartEmailBackgroundMonitor(newInterval);
    }

    // If notifications were turned on, perform a check
    if (updated.notifications?.enabled && !previousSettings.notifications?.enabled) {
      checkAndNotifyNewEmails().catch(() => {});
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('[Email Settings] Erro ao salvar:', error?.message || error);
    return NextResponse.json(
      { error: 'Não foi possível atualizar as configurações de e-mail.' },
      { status: 500 }
    );
  }
}
