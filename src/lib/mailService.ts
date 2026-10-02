/**
 * TECH7 Electronics — Server-side Mail Service
 *
 * SECURITY NOTICE:
 * - MAIL_PASSWORD is NEVER exposed to the browser
 * - All IMAP/SMTP operations happen exclusively server-side
 * - This module must NEVER be imported by client components
 */

import nodemailer from 'nodemailer';
import type { EmailMessage, EmailFull, EmailAttachmentMeta } from './emailTypes';

// ─── ENVIRONMENT CONFIG ─────────────────────────────────

function getMailConfig() {
  return {
    user: process.env.MAIL_USER || 'comercial@tech7electronics.com',
    password: process.env.MAIL_PASSWORD || '',
    imapHost: process.env.MAIL_IMAP_HOST || 'imap.hostinger.com',
    imapPort: parseInt(process.env.MAIL_IMAP_PORT || '993', 10),
    imapSecure: process.env.MAIL_IMAP_SECURE !== 'false',
    smtpHost: process.env.MAIL_SMTP_HOST || 'smtp.hostinger.com',
    smtpPort: parseInt(process.env.MAIL_SMTP_PORT || '465', 10),
    smtpSecure: process.env.MAIL_SMTP_SECURE !== 'false',
  };
}

// ─── IMAP HELPERS ──────────────────────────────────────

/**
 * Dynamic import of imap-simple to avoid issues with Next.js bundling.
 * imap-simple is a Node.js-only module and must stay server-side.
 */
async function getImapSimple() {
  const imapSimple = await import('imap-simple');
  return imapSimple;
}

async function openImapConnection(folder: string = 'INBOX') {
  const cfg = getMailConfig();

  if (!cfg.password) {
    throw new Error('Configuração de e-mail incompleta. Verifique MAIL_PASSWORD no servidor.');
  }

  const imapSimple = await getImapSimple();

  const connection = await imapSimple.connect({
    imap: {
      user: cfg.user,
      password: cfg.password,
      host: cfg.imapHost,
      port: cfg.imapPort,
      tls: cfg.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 15000,
    },
  });

  await connection.openBox(folder);
  return connection;
}

// ─── FOLDER MAPPING ────────────────────────────────────

const FOLDER_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
  spam: 'Spam',
  starred: 'INBOX', // Starred is local metadata over inbox
};

export function resolveImapFolder(view: string): string {
  return FOLDER_MAP[view.toLowerCase()] || 'INBOX';
}

// ─── LIST MESSAGES ─────────────────────────────────────

export async function listMessages(options: {
  folder?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ messages: EmailMessage[]; total: number }> {
  const folder = resolveImapFolder(options.folder || 'inbox');
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(10, options.pageSize || 25));

  const connection = await openImapConnection(folder);

  try {
    // Build search criteria
    const criteria: any[] = options.search
      ? [['OR', ['SUBJECT', options.search], ['FROM', options.search]]]
      : ['ALL'];

    const searchResults = await connection.search(criteria, {
      bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)'],
      markSeen: false,
      struct: true,
    });

    // Sort newest first (descending UID)
    const sorted = searchResults.sort((a: any, b: any) => b.attributes.uid - a.attributes.uid);
    const total = sorted.length;

    const start = (page - 1) * pageSize;
    const slice = sorted.slice(start, start + pageSize);

    const messages: EmailMessage[] = slice.map((item: any) => {
      const header = item.parts.find((p: any) => p.which.startsWith('HEADER'))?.body || {};
      const from = Array.isArray(header.from) ? header.from[0] : (header.from || '');
      const subject = Array.isArray(header.subject) ? header.subject[0] : (header.subject || '(sem assunto)');
      const date = Array.isArray(header.date) ? header.date[0] : (header.date || '');

      const { displayName, email: fromEmail } = parseAddress(from);
      const flags: string[] = item.attributes.flags || [];
      const isRead = flags.includes('\\Seen');
      const hasAttachments = hasStructAttachments(item.attributes.struct);

      return {
        uid: item.attributes.uid,
        messageId: Array.isArray(header['message-id']) ? header['message-id'][0] : undefined,
        subject: decodeHeaderValue(subject),
        from: displayName || fromEmail,
        fromEmail,
        to: [],
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        isRead,
        hasAttachments,
        snippet: '',
        folder,
      };
    });

    return { messages, total };
  } finally {
    connection.end();
  }
}

// ─── FETCH FULL MESSAGE ────────────────────────────────

export async function fetchMessage(uid: number, folder: string = 'INBOX'): Promise<EmailFull | null> {
  const imapFolder = resolveImapFolder(folder);
  const connection = await openImapConnection(imapFolder);

  try {
    const results = await connection.search([['UID', String(uid)]], {
      bodies: [''],
      markSeen: false,
      struct: true,
    });

    if (!results || results.length === 0) return null;

    const item = results[0];
    const rawBody = item.parts.find((p: any) => p.which === '')?.body || '';

    // Parse the full message with mailparser
    const { simpleParser } = await import('mailparser');
    const parsed = await simpleParser(rawBody);

    const flags: string[] = item.attributes.flags || [];
    const isRead = flags.includes('\\Seen');

    const attachments: EmailAttachmentMeta[] = (parsed.attachments || []).map((att: any) => ({
      filename: sanitizeFilename(att.filename || 'anexo'),
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      cid: att.cid,
    }));

    const toAddresses = Array.isArray(parsed.to)
      ? parsed.to.flatMap((t: any) => (t.value || []).map((v: any) => v.address || ''))
      : parsed.to
      ? (parsed.to as any).value?.map((v: any) => v.address || '') || []
      : [];

    const ccAddresses = Array.isArray(parsed.cc)
      ? parsed.cc.flatMap((c: any) => (c.value || []).map((v: any) => v.address || ''))
      : parsed.cc
      ? (parsed.cc as any).value?.map((v: any) => v.address || '') || []
      : [];

    const { displayName: fromName, email: fromEmail } = parseAddress(
      parsed.from?.text || ''
    );

    return {
      uid,
      messageId: parsed.messageId,
      subject: parsed.subject || '(sem assunto)',
      from: fromName || fromEmail,
      fromEmail,
      replyTo: parsed.replyTo?.text,
      to: toAddresses,
      cc: ccAddresses,
      date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
      isRead,
      hasAttachments: attachments.length > 0,
      snippet: (parsed.text || '').slice(0, 200),
      bodyHtml: sanitizeEmailHtml(parsed.html || ''),
      bodyText: parsed.text || '',
      attachments,
      folder: imapFolder,
    };
  } finally {
    connection.end();
  }
}

// ─── MARK AS READ/UNREAD ───────────────────────────────

export async function markMessage(
  uid: number,
  folder: string,
  action: 'read' | 'unread'
): Promise<void> {
  const imapFolder = resolveImapFolder(folder);
  const connection = await openImapConnection(imapFolder);
  try {
    if (action === 'read') {
      await connection.addFlags(uid, ['\\Seen']);
    } else {
      await connection.delFlags(uid, ['\\Seen']);
    }
  } finally {
    connection.end();
  }
}

// ─── DELETE (MOVE TO TRASH) ────────────────────────────

export async function moveToTrash(uid: number, sourceFolder: string): Promise<void> {
  const imapSource = resolveImapFolder(sourceFolder);
  const imapTrash = resolveImapFolder('trash');
  const connection = await openImapConnection(imapSource);
  try {
    await connection.moveMessage(String(uid), imapTrash);
  } finally {
    connection.end();
  }
}

// ─── SMTP SEND ─────────────────────────────────────────

export interface SendMailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  headers?: Record<string, string>;
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const cfg = getMailConfig();

  if (!cfg.password) {
    throw new Error('Senha de e-mail não configurada no servidor (MAIL_PASSWORD).');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: { user: cfg.user, pass: cfg.password },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"TECH7 Electronics" <${cfg.user}>`,
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || stripHtml(opts.html),
    replyTo: opts.replyTo,
    inReplyTo: opts.inReplyTo,
    references: opts.references,
    attachments: opts.attachments,
    headers: opts.headers,
  });
}

// ─── HELPERS ───────────────────────────────────────────

function parseAddress(raw: string): { displayName: string; email: string } {
  if (!raw) return { displayName: '', email: '' };
  const match = raw.match(/^(.+?)\s*<([^>]+)>/);
  if (match) {
    return { displayName: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim() };
  }
  return { displayName: '', email: raw.trim() };
}

function hasStructAttachments(struct: any[]): boolean {
  if (!Array.isArray(struct)) return false;
  for (const part of struct) {
    if (Array.isArray(part)) {
      if (hasStructAttachments(part)) return true;
    } else if (part && part.disposition && part.disposition.type?.toLowerCase() === 'attachment') {
      return true;
    }
  }
  return false;
}

function decodeHeaderValue(value: string): string {
  if (!value) return '';
  // Decode RFC2047 encoded words like =?UTF-8?B?...?= or =?UTF-8?Q?...?=
  return value.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, charset, encoding, encoded) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(encoded, 'base64').toString('utf-8');
      } else {
        return encoded.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_m: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16))
        );
      }
    } catch {
      return value;
    }
  });
}

/**
 * Minimal HTML sanitizer for incoming email content.
 * Removes scripts, event handlers, javascript: hrefs, and other XSS vectors.
 * Does NOT use dangerouslySetInnerHTML - the result is rendered via srcdoc in a sandboxed iframe.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return '';

  let clean = html;

  // Remove script tags and their content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags that may contain expression()
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, (match) => {
    // Allow style but remove javascript expressions
    return match.replace(/expression\s*\(/gi, 'blocked(');
  });

  // Remove dangerous event handlers (onclick=, onload=, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: and vbscript: in href/src/action
  clean = clean.replace(/(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
  clean = clean.replace(/(href|src|action)\s*=\s*(?:"vbscript:[^"]*"|'vbscript:[^']*')/gi, '');

  // Remove <iframe>, <object>, <embed>, <form>
  clean = clean.replace(/<\/?(?:iframe|object|embed|form|base)\b[^>]*>/gi, '');

  // Remove meta refresh
  clean = clean.replace(/<meta\s[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');

  return clean;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 200);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

// ─── UNSUBSCRIBE FOOTER ────────────────────────────────

export function buildUnsubscribeFooter(email: string, campaignId: string, baseUrl: string): string {
  const token = Buffer.from(`${email}:${campaignId}`).toString('base64url');
  const url = `${baseUrl}/api/admin/email/unsubscribe?token=${token}`;
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;text-align:center;">
      <p>Você está recebendo este e-mail porque está cadastrado como cliente TECH7 Electronics.<br/>
      Para cancelar o recebimento de e-mails de marketing, <a href="${url}" style="color:#64748B;">clique aqui</a>.</p>
    </div>
  `;
}
