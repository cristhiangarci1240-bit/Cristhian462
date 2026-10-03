// ============================================================
// TECH7 ELECTRONICS — EMAIL SYSTEM TYPES
// ============================================================

export interface EmailMessage {
  uid: number;
  messageId?: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string[];
  cc?: string[];
  date: string;
  isRead: boolean;
  isStarred?: boolean;
  hasAttachments: boolean;
  snippet: string;
  folder: string;
}

export interface EmailFull extends EmailMessage {
  bodyHtml?: string;
  bodyText?: string;
  attachments: EmailAttachmentMeta[];
  replyTo?: string;
}

export interface EmailAttachmentMeta {
  filename: string;
  contentType: string;
  size: number;
  cid?: string;
  // Download key - references a safe server-side token
  downloadKey?: string;
}

export interface EmailDraft {
  id: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  createdAt: string;
  updatedAt: string;
  inReplyToUid?: number;
  inReplyToFolder?: string;
  isForward?: boolean;
}

// ─── CAMPAIGNS ────────────────────────────────────────────

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'completed'
  | 'completed_with_errors'
  | 'cancelled';

export type CampaignRecipientStatus = 'pending' | 'sent' | 'failed';

export interface EmailCampaign {
  id: string;
  name: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  status: CampaignStatus;
  recipientFilter: CampaignRecipientFilter;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  cancelledAt?: string;
}

export interface CampaignRecipientFilter {
  type: 'all' | 'selected' | 'filtered';
  selectedIds?: string[];
  // Filters are applied over the existing Client records
  filterName?: string;
  filterEmail?: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  clientId?: string;
  email: string;
  name: string;
  status: CampaignRecipientStatus;
  sentAt?: string;
  errorMessage?: string;
  retryCount: number;
  unsubscribed?: boolean;
}

// ─── EMAIL SETTINGS ──────────────────────────────────────

export interface EmailSignatureSettings {
  enabled: boolean;
  text: string;
  imageUrl: string;
  maxWidth: number;
  includeInReplies: boolean;
  includeInForwards: boolean;
}

export interface EmailNotificationLog {
  id: string;
  sentAt: string;
  recipientEmail: string;
  uid: number;
  messageId?: string;
  subject: string;
  from: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  recipientEmail: string;
  notifiedUids: number[];
  notifiedMessageIds?: string[];
  checkIntervalMinutes: number;
  lastCheckAt?: string;
  lastStatus?: string;
  logs?: EmailNotificationLog[];
}

export interface EmailAttachmentSettings {
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  maxFilesCount: number;
  allowedExtensions: string[];
}

export interface EmailSettings {
  signature: EmailSignatureSettings;
  notifications: EmailNotificationSettings;
  attachments: EmailAttachmentSettings;
}

// ─── EMAIL DATABASE SCHEMA EXTENSION ─────────────────────

export interface EmailDatabaseSchema {
  drafts: EmailDraft[];
  campaigns: EmailCampaign[];
  campaignRecipients: CampaignRecipient[];
  // Track email opt-outs per email address
  emailOptOuts: EmailOptOut[];
  // Persistent system email settings
  settings?: EmailSettings;
}

export interface EmailOptOut {
  email: string;
  optedOutAt: string;
  reason?: string;
}

