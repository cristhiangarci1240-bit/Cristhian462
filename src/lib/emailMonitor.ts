/**
 * TECH7 Electronics — Server-Side Email Background Monitor
 *
 * CRITICAL CONDITIONS:
 * 1. Executes strictly on the server (Node.js runtime), NEVER on the client.
 * 2. Starts automatically when the Node.js application / Docker container boots.
 * 3. Protected against multiple monitor instances in the same process (singleton timer).
 * 4. Mutex lock prevents concurrent IMAP queries.
 * 5. Robust error handling: IMAP failures are logged and do not kill the monitor.
 * 6. Configurable interval dynamically updated from email settings.
 * 7. Duplicate notifications are strictly prevented using IMAP UID tracking in data/email_data.json.
 * 8. database.json is NEVER touched.
 */

import { listMessages, sendMail } from './mailService';
import {
  getEmailSettings,
  updateEmailSettings,
  isMessageNotified,
  markMessageNotified,
  markMultipleMessagesNotified,
  recordNotificationLog,
} from './emailDb';

// Global singletons to prevent multiple timers/executions across hot-reloads
declare global {
  var __emailMonitorTimer: NodeJS.Timeout | undefined;
  var __emailMonitorIsChecking: boolean | undefined;
  var __emailMonitorIntervalMinutes: number | undefined;
}

const DEFAULT_INTERVAL_MINUTES = 2;

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://tech7electronics.com'
  ).replace(/\/+$/, '');
}

/**
 * Checks INBOX for unnotified emails and dispatches an alert email to the personal address.
 */
export async function checkAndNotifyNewEmails(): Promise<{ checked: number; notified: number }> {
  // Prevent concurrent executions (Condition 5)
  if (globalThis.__emailMonitorIsChecking) {
    return { checked: 0, notified: 0 };
  }

  globalThis.__emailMonitorIsChecking = true;

  try {
    const settings = await getEmailSettings();

    // If notifications are turned OFF or no recipient email is configured, exit safely (Requirement 13)
    if (!settings.notifications.enabled || !settings.notifications.recipientEmail.trim()) {
      return { checked: 0, notified: 0 };
    }

    const recipientEmail = settings.notifications.recipientEmail.trim();

    // Query INBOX with 25 newest messages
    const { messages } = await listMessages({
      folder: 'inbox',
      page: 1,
      pageSize: 25,
    });

    if (!messages || messages.length === 0) {
      await updateEmailSettings({
        notifications: {
          ...settings.notifications,
          lastCheckAt: new Date().toISOString(),
          lastStatus: 'ok_empty',
        },
      });
      return { checked: 0, notified: 0 };
    }

    // Baseline seeding: if notifiedUids & notifiedMessageIds are empty (first time running),
    // mark all currently present messages as baseline so the admin does not get spammed
    const hasUids = settings.notifications.notifiedUids && settings.notifications.notifiedUids.length > 0;
    const hasMsgIds = settings.notifications.notifiedMessageIds && settings.notifications.notifiedMessageIds.length > 0;

    if (!hasUids && !hasMsgIds) {
      const allCurrent = messages.map((m) => ({ uid: m.uid, messageId: m.messageId }));
      await markMultipleMessagesNotified(allCurrent);
      console.log(`[EmailMonitor] Linha de base inicial estabelecida para ${allCurrent.length} e-mails históricos.`);
      await updateEmailSettings({
        notifications: {
          ...settings.notifications,
          notifiedUids: allCurrent.map((c) => c.uid),
          notifiedMessageIds: allCurrent.map((c) => c.messageId).filter(Boolean) as string[],
          lastCheckAt: new Date().toISOString(),
          lastStatus: 'baseline_initialized',
        },
      });
      return { checked: messages.length, notified: 0 };
    }

    let notifiedCount = 0;
    const baseUrl = getBaseUrl();

    // Iterate through messages (newest first)
    for (const msg of messages) {
      const alreadyNotified = await isMessageNotified(msg.uid, msg.messageId);
      if (alreadyNotified) {
        continue;
      }

      // Format notification email in Portuguese as strictly requested
      const openPanelUrl = `${baseUrl}/admin/email?folder=inbox&uid=${msg.uid}`;
      const msgDate = new Date(msg.date);
      const formattedDate = msgDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const formattedTime = msgDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const previewSnippet = msg.snippet ? msg.snippet.slice(0, 180) : '(sem prévia disponível)';
      const safeFrom = msg.from || msg.fromEmail || 'Remetente Desconhecido';
      const safeSubject = msg.subject || '(sem assunto)';

      const notificationHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.04);">
          <div style="background:#0F172A;padding:20px 24px;border-bottom:3px solid #008744;">
            <h2 style="color:#FFFFFF;margin:0;font-size:18px;font-weight:700;">Novo e-mail recebido</h2>
            <p style="color:#94A3B8;margin:4px 0 0 0;font-size:12px;">Alerta de e-mail corporativo — TECH7 Electronics</p>
          </div>
          <div style="padding:24px;">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong>Remetente:</strong> ${escapeHtml(safeFrom)} &lt;${escapeHtml(msg.fromEmail)}&gt;</p>
              <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong>Assunto:</strong> ${escapeHtml(safeSubject)}</p>
              <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong>Data:</strong> ${formattedDate}</p>
              <p style="margin:0 0 8px 0;font-size:14px;color:#334155;"><strong>Hora:</strong> ${formattedTime}</p>
              ${msg.messageId ? `<p style="margin:0 0 8px 0;font-size:12px;color:#64748B;"><strong>Identificador (Message-ID):</strong> ${escapeHtml(msg.messageId)}</p>` : ''}
              <p style="margin:0 0 8px 0;font-size:12px;color:#64748B;"><strong>UID IMAP:</strong> ${msg.uid}</p>
              <p style="margin:8px 0 0 0;font-size:13px;color:#64748B;line-height:1.5;"><strong>Prévia:</strong> ${escapeHtml(previewSnippet)}</p>
            </div>
            <div style="text-align:center;margin-top:24px;">
              <a href="${openPanelUrl}" style="display:inline-block;background:#008744;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:700;font-size:14px;box-shadow:0 2px 4px rgba(0,135,68,0.2);">
                Abrir no Painel
              </a>
            </div>
          </div>
          <div style="background:#F1F5F9;padding:12px 24px;text-align:center;font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;">
            Notificação automática enviada pelo servidor TECH7 Electronics.
          </div>
        </div>
      `;

      try {
        await sendMail({
          to: recipientEmail,
          subject: `Novo e-mail recebido: ${safeSubject.slice(0, 50)}`,
          html: notificationHtml,
          text: `Novo e-mail recebido - TECH7 Electronics\n\nRemetente: ${safeFrom} <${msg.fromEmail}>\nAssunto: ${safeSubject}\nData: ${formattedDate}\nHora: ${formattedTime}\nUID IMAP: ${msg.uid}\n${msg.messageId ? `Message-ID: ${msg.messageId}\n` : ''}Prévia: ${previewSnippet}\n\nAbrir no Painel: ${openPanelUrl}`,
        });

        // Mark UID and Message-ID immediately in database to guarantee no duplicates (Condition 6 & 8)
        await markMessageNotified(msg.uid, msg.messageId);

        // Record notification audit log (Condition 15)
        await recordNotificationLog({
          recipientEmail,
          uid: msg.uid,
          messageId: msg.messageId,
          subject: safeSubject,
          from: `${safeFrom} <${msg.fromEmail}>`,
          status: 'success',
        });

        notifiedCount++;
        console.log(`[EmailMonitor] Notificação enviada para ${recipientEmail} referente ao e-mail UID ${msg.uid}.`);
      } catch (sendErr: any) {
        console.error(`[EmailMonitor] Falha ao enviar e-mail de notificação para UID ${msg.uid}:`, sendErr?.message || sendErr);

        // Record failed attempt in audit log
        await recordNotificationLog({
          recipientEmail,
          uid: msg.uid,
          messageId: msg.messageId,
          subject: safeSubject,
          from: `${safeFrom} <${msg.fromEmail}>`,
          status: 'failed',
          error: sendErr?.message || String(sendErr),
        });
      }
    }

    await updateEmailSettings({
      notifications: {
        ...settings.notifications,
        lastCheckAt: new Date().toISOString(),
        lastStatus: notifiedCount > 0 ? `notified_${notifiedCount}` : 'ok_no_new',
      },
    });

    return { checked: messages.length, notified: notifiedCount };
  } catch (error: any) {
    // Condition 6 & 10: Log error and do NOT kill monitor
    console.error('[EmailMonitor] Erro na consulta IMAP:', error?.message || error);
    try {
      const current = await getEmailSettings();
      await updateEmailSettings({
        notifications: {
          ...current.notifications,
          lastCheckAt: new Date().toISOString(),
          lastStatus: `error: ${String(error?.message || 'Falha de conexão IMAP').slice(0, 100)}`,
        },
      });
    } catch {
      // Ignore inner error
    }
    return { checked: 0, notified: 0 };
  } finally {
    globalThis.__emailMonitorIsChecking = false;
  }
}

/**
 * Starts the server-side email background monitor.
 * Safe to call multiple times: singleton protection prevents duplicates.
 */
export function startEmailBackgroundMonitor(intervalMinutes?: number): void {
  // Never run in browser (Condition 1)
  if (typeof window !== 'undefined') {
    return;
  }

  const mins = Math.max(1, Math.min(60, intervalMinutes || globalThis.__emailMonitorIntervalMinutes || DEFAULT_INTERVAL_MINUTES));
  globalThis.__emailMonitorIntervalMinutes = mins;

  // Condition 4: If timer already running with same interval, do nothing
  if (globalThis.__emailMonitorTimer) {
    return;
  }

  const intervalMs = mins * 60 * 1000;
  console.log(`[EmailMonitor] Monitor em segundo plano iniciado no servidor (intervalo: ${mins} min).`);

  // Initial check after short delay (15 seconds after server start)
  setTimeout(() => {
    checkAndNotifyNewEmails().catch((err) => {
      console.error('[EmailMonitor] Erro no ciclo inicial:', err?.message || err);
    });
  }, 15000);

  // Periodic interval
  globalThis.__emailMonitorTimer = setInterval(() => {
    checkAndNotifyNewEmails().catch((err) => {
      console.error('[EmailMonitor] Erro no ciclo periódico:', err?.message || err);
    });
  }, intervalMs);
}

/**
 * Restarts the monitor with a new interval (called when settings change).
 */
export function restartEmailBackgroundMonitor(intervalMinutes: number): void {
  if (typeof window !== 'undefined') return;

  if (globalThis.__emailMonitorTimer) {
    clearInterval(globalThis.__emailMonitorTimer);
    globalThis.__emailMonitorTimer = undefined;
  }

  startEmailBackgroundMonitor(intervalMinutes);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
