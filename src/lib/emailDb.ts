import fs from 'fs';
import path from 'path';
import {
  EmailDatabaseSchema,
  EmailDraft,
  EmailCampaign,
  CampaignRecipient,
  EmailOptOut,
  EmailSettings,
} from './emailTypes';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMAIL_DB_FILE = path.join(DATA_DIR, 'email_data.json');

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  signature: {
    enabled: true,
    text: 'Atenciosamente,\nEquipe TECH7 Electronics\ncomercial@tech7electronics.com',
    imageUrl: '',
    maxWidth: 320,
    includeInReplies: true,
    includeInForwards: true,
  },
  notifications: {
    enabled: false,
    recipientEmail: '',
    notifiedUids: [],
    notifiedMessageIds: [],
    checkIntervalMinutes: 2,
    lastCheckAt: undefined,
    lastStatus: 'idle',
    logs: [],
  },
  attachments: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    maxTotalSizeBytes: 25 * 1024 * 1024, // 25MB
    maxFilesCount: 10,
    allowedExtensions: [
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.zip',
    ],
  },
};

const EMPTY_EMAIL_DB: EmailDatabaseSchema = {
  drafts: [],
  campaigns: [],
  campaignRecipients: [],
  emailOptOuts: [],
  settings: DEFAULT_EMAIL_SETTINGS,
};

function ensureEmailDb(): EmailDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EMAIL_DB_FILE)) {
    fs.writeFileSync(EMAIL_DB_FILE, JSON.stringify(EMPTY_EMAIL_DB, null, 2), 'utf-8');
    return { ...EMPTY_EMAIL_DB };
  }
  try {
    const raw = fs.readFileSync(EMAIL_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as EmailDatabaseSchema;
    // Forward migrations
    if (!parsed.drafts) parsed.drafts = [];
    if (!parsed.campaigns) parsed.campaigns = [];
    if (!parsed.campaignRecipients) parsed.campaignRecipients = [];
    if (!parsed.emailOptOuts) parsed.emailOptOuts = [];
    if (!parsed.settings) {
      parsed.settings = { ...DEFAULT_EMAIL_SETTINGS };
    } else {
      if (!parsed.settings.signature) parsed.settings.signature = { ...DEFAULT_EMAIL_SETTINGS.signature };
      if (!parsed.settings.notifications) parsed.settings.notifications = { ...DEFAULT_EMAIL_SETTINGS.notifications };
      if (!parsed.settings.notifications.notifiedUids) parsed.settings.notifications.notifiedUids = [];
      if (!parsed.settings.notifications.notifiedMessageIds) parsed.settings.notifications.notifiedMessageIds = [];
      if (!parsed.settings.notifications.logs) parsed.settings.notifications.logs = [];
      if (!parsed.settings.attachments) parsed.settings.attachments = { ...DEFAULT_EMAIL_SETTINGS.attachments };
    }
    return parsed;
  } catch {
    fs.writeFileSync(EMAIL_DB_FILE, JSON.stringify(EMPTY_EMAIL_DB, null, 2), 'utf-8');
    return { ...EMPTY_EMAIL_DB };
  }
}

function saveEmailDb(data: EmailDatabaseSchema): void {
  try {
    fs.writeFileSync(EMAIL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[EmailDB] Erro ao salvar email_data.json:', err);
  }
}

// ─── EMAIL SETTINGS ──────────────────────────────────────

export async function getEmailSettings(): Promise<EmailSettings> {
  const db = ensureEmailDb();
  return db.settings || DEFAULT_EMAIL_SETTINGS;
}

export async function updateEmailSettings(partial: Partial<EmailSettings>): Promise<EmailSettings> {
  const db = ensureEmailDb();
  const current = db.settings || DEFAULT_EMAIL_SETTINGS;
  db.settings = {
    signature: {
      ...current.signature,
      ...(partial.signature || {}),
    },
    notifications: {
      ...current.notifications,
      ...(partial.notifications || {}),
    },
    attachments: {
      ...current.attachments,
      ...(partial.attachments || {}),
    },
  };
  saveEmailDb(db);
  return db.settings;
}

export async function isMessageNotified(uid: number, messageId?: string): Promise<boolean> {
  const db = ensureEmailDb();
  const uids = db.settings?.notifications?.notifiedUids || [];
  if (uids.includes(uid)) return true;
  if (messageId && db.settings?.notifications?.notifiedMessageIds?.includes(messageId)) {
    return true;
  }
  return false;
}

export async function markMessageNotified(uid: number, messageId?: string): Promise<void> {
  const db = ensureEmailDb();
  if (!db.settings) db.settings = { ...DEFAULT_EMAIL_SETTINGS };
  if (!db.settings.notifications) db.settings.notifications = { ...DEFAULT_EMAIL_SETTINGS.notifications };
  if (!db.settings.notifications.notifiedUids) db.settings.notifications.notifiedUids = [];
  if (!db.settings.notifications.notifiedMessageIds) db.settings.notifications.notifiedMessageIds = [];

  let changed = false;
  if (!db.settings.notifications.notifiedUids.includes(uid)) {
    db.settings.notifications.notifiedUids.push(uid);
    changed = true;
  }
  if (messageId && !db.settings.notifications.notifiedMessageIds.includes(messageId)) {
    db.settings.notifications.notifiedMessageIds.push(messageId);
    changed = true;
  }

  if (changed) {
    if (db.settings.notifications.notifiedUids.length > 5000) {
      db.settings.notifications.notifiedUids = db.settings.notifications.notifiedUids.slice(-5000);
    }
    if (db.settings.notifications.notifiedMessageIds.length > 5000) {
      db.settings.notifications.notifiedMessageIds = db.settings.notifications.notifiedMessageIds.slice(-5000);
    }
    saveEmailDb(db);
  }
}

export async function markMultipleMessagesNotified(items: Array<{ uid: number; messageId?: string }>): Promise<void> {
  const db = ensureEmailDb();
  if (!db.settings) db.settings = { ...DEFAULT_EMAIL_SETTINGS };
  if (!db.settings.notifications) db.settings.notifications = { ...DEFAULT_EMAIL_SETTINGS.notifications };
  if (!db.settings.notifications.notifiedUids) db.settings.notifications.notifiedUids = [];
  if (!db.settings.notifications.notifiedMessageIds) db.settings.notifications.notifiedMessageIds = [];

  const existingUidSet = new Set(db.settings.notifications.notifiedUids);
  const existingMsgIdSet = new Set(db.settings.notifications.notifiedMessageIds);
  let changed = false;

  for (const item of items) {
    if (!existingUidSet.has(item.uid)) {
      existingUidSet.add(item.uid);
      changed = true;
    }
    if (item.messageId && !existingMsgIdSet.has(item.messageId)) {
      existingMsgIdSet.add(item.messageId);
      changed = true;
    }
  }

  if (changed) {
    db.settings.notifications.notifiedUids = Array.from(existingUidSet).slice(-5000);
    db.settings.notifications.notifiedMessageIds = Array.from(existingMsgIdSet).slice(-5000);
    saveEmailDb(db);
  }
}

export async function recordNotificationLog(log: {
  recipientEmail: string;
  uid: number;
  messageId?: string;
  subject: string;
  from: string;
  status: 'success' | 'failed';
  error?: string;
}): Promise<void> {
  const db = ensureEmailDb();
  if (!db.settings) db.settings = { ...DEFAULT_EMAIL_SETTINGS };
  if (!db.settings.notifications) db.settings.notifications = { ...DEFAULT_EMAIL_SETTINGS.notifications };
  if (!db.settings.notifications.logs) db.settings.notifications.logs = [];

  const logItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sentAt: new Date().toISOString(),
    recipientEmail: log.recipientEmail,
    uid: log.uid,
    messageId: log.messageId,
    subject: log.subject,
    from: log.from,
    status: log.status,
    error: log.error,
  };

  db.settings.notifications.logs.unshift(logItem);
  if (db.settings.notifications.logs.length > 50) {
    db.settings.notifications.logs = db.settings.notifications.logs.slice(0, 50);
  }

  saveEmailDb(db);
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ─── DRAFTS ──────────────────────────────────────────────

export async function getDrafts(): Promise<EmailDraft[]> {
  const db = ensureEmailDb();
  return db.drafts.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getDraftById(id: string): Promise<EmailDraft | null> {
  const db = ensureEmailDb();
  return db.drafts.find((d) => d.id === id) || null;
}

export async function upsertDraft(
  data: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<EmailDraft> {
  const db = ensureEmailDb();
  const now = new Date().toISOString();

  if (data.id) {
    const idx = db.drafts.findIndex((d) => d.id === data.id);
    if (idx !== -1) {
      db.drafts[idx] = { ...db.drafts[idx], ...data, updatedAt: now };
      saveEmailDb(db);
      return db.drafts[idx];
    }
  }

  const draft: EmailDraft = {
    ...data,
    id: generateId('dft'),
    createdAt: now,
    updatedAt: now,
  };
  db.drafts.push(draft);
  saveEmailDb(db);
  return draft;
}

export async function deleteDraft(id: string): Promise<boolean> {
  const db = ensureEmailDb();
  const before = db.drafts.length;
  db.drafts = db.drafts.filter((d) => d.id !== id);
  if (db.drafts.length !== before) {
    saveEmailDb(db);
    return true;
  }
  return false;
}

// ─── CAMPAIGNS ────────────────────────────────────────────

export async function getCampaigns(): Promise<EmailCampaign[]> {
  const db = ensureEmailDb();
  return db.campaigns.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCampaignById(id: string): Promise<EmailCampaign | null> {
  const db = ensureEmailDb();
  return db.campaigns.find((c) => c.id === id) || null;
}

export async function createCampaign(
  data: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'failedCount'>
): Promise<EmailCampaign> {
  const db = ensureEmailDb();
  const now = new Date().toISOString();
  const campaign: EmailCampaign = {
    ...data,
    id: generateId('cmp'),
    sentCount: 0,
    failedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.campaigns.push(campaign);
  saveEmailDb(db);
  return campaign;
}

export async function updateCampaign(
  id: string,
  partial: Partial<EmailCampaign>
): Promise<EmailCampaign | null> {
  const db = ensureEmailDb();
  const idx = db.campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.campaigns[idx] = {
    ...db.campaigns[idx],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveEmailDb(db);
  return db.campaigns[idx];
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const db = ensureEmailDb();
  const before = db.campaigns.length;
  db.campaigns = db.campaigns.filter((c) => c.id !== id);
  // Also remove recipients
  db.campaignRecipients = db.campaignRecipients.filter((r) => r.campaignId !== id);
  if (db.campaigns.length !== before) {
    saveEmailDb(db);
    return true;
  }
  return false;
}

// ─── CAMPAIGN RECIPIENTS ─────────────────────────────────

export async function getCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]> {
  const db = ensureEmailDb();
  return db.campaignRecipients.filter((r) => r.campaignId === campaignId);
}

export async function bulkCreateCampaignRecipients(
  recipients: Omit<CampaignRecipient, 'id'>[]
): Promise<CampaignRecipient[]> {
  const db = ensureEmailDb();
  const created: CampaignRecipient[] = recipients.map((r) => ({
    ...r,
    id: generateId('rcpt'),
  }));
  db.campaignRecipients.push(...created);
  saveEmailDb(db);
  return created;
}

export async function updateCampaignRecipient(
  id: string,
  partial: Partial<CampaignRecipient>
): Promise<boolean> {
  const db = ensureEmailDb();
  const idx = db.campaignRecipients.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  db.campaignRecipients[idx] = { ...db.campaignRecipients[idx], ...partial };
  saveEmailDb(db);
  return true;
}

// ─── OPT-OUTS ─────────────────────────────────────────────

export async function isEmailOptedOut(email: string): Promise<boolean> {
  const db = ensureEmailDb();
  return db.emailOptOuts.some((o) => o.email.toLowerCase() === email.toLowerCase());
}

export async function addEmailOptOut(email: string, reason?: string): Promise<void> {
  const db = ensureEmailDb();
  const already = db.emailOptOuts.some((o) => o.email.toLowerCase() === email.toLowerCase());
  if (!already) {
    db.emailOptOuts.push({ email: email.toLowerCase(), optedOutAt: new Date().toISOString(), reason });
    saveEmailDb(db);
  }
}

export async function getEmailOptOuts(): Promise<EmailOptOut[]> {
  const db = ensureEmailDb();
  return db.emailOptOuts;
}

export async function removeEmailOptOut(email: string): Promise<boolean> {
  const db = ensureEmailDb();
  const before = db.emailOptOuts.length;
  db.emailOptOuts = db.emailOptOuts.filter((o) => o.email.toLowerCase() !== email.toLowerCase());
  if (db.emailOptOuts.length !== before) {
    saveEmailDb(db);
    return true;
  }
  return false;
}
