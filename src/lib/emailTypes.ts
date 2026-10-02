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

// ─── EMAIL DATABASE SCHEMA EXTENSION ─────────────────────

export interface EmailDatabaseSchema {
  drafts: EmailDraft[];
  campaigns: EmailCampaign[];
  campaignRecipients: CampaignRecipient[];
  // Track email opt-outs per email address
  emailOptOuts: EmailOptOut[];
}

export interface EmailOptOut {
  email: string;
  optedOutAt: string;
  reason?: string;
}
