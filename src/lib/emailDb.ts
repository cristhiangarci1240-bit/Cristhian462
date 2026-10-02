import fs from 'fs';
import path from 'path';
import { EmailDatabaseSchema, EmailDraft, EmailCampaign, CampaignRecipient, EmailOptOut } from './emailTypes';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMAIL_DB_FILE = path.join(DATA_DIR, 'email_data.json');

const EMPTY_EMAIL_DB: EmailDatabaseSchema = {
  drafts: [],
  campaigns: [],
  campaignRecipients: [],
  emailOptOuts: [],
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
