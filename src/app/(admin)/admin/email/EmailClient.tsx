'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Star,
  RefreshCw,
  Search,
  Plus,
  Mail,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Reply,
  Forward,
  Eye,
  Megaphone,
  Smartphone,
  Monitor,
  X,
  Users,
  SendHorizontal,
  Settings,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import type { Client } from '@/lib/types';
import type {
  EmailMessage,
  EmailFull,
  EmailDraft,
  EmailCampaign,
  CampaignRecipient,
  EmailSettings,
} from '@/lib/emailTypes';
import styles from './EmailClient.module.css';

interface EmailClientProps {
  initialClients: Client[];
  mailUser: string;
}

type ActiveFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash' | 'campaigns' | 'settings';

export function EmailClient({ initialClients, mailUser }: EmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = (searchParams.get('folder') || 'inbox') as ActiveFolder;

  const [activeFolder, setActiveFolder] = useState<ActiveFolder>(folderParam);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected message for Reader view
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [fullMessage, setFullMessage] = useState<EmailFull | null>(null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // Checkbox selections for batch actions
  const [selectedUids, setSelectedUids] = useState<number[]>([]);

  // Starred messages (stored locally in localStorage for quick access)
  const [starredSet, setStarredSet] = useState<Set<number>>(new Set());

  // Drafts state
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [activeCampaignDetail, setActiveCampaignDetail] = useState<{
    campaign: EmailCampaign;
    recipients: CampaignRecipient[];
  } | null>(null);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeId, setComposeId] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [inReplyToMsgId, setInReplyToMsgId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const composeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Settings State
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ user: string; status: string; imapHost: string; smtpHost: string } | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [testNotificationEmail, setTestNotificationEmail] = useState('');
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const signatureFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Campaign Wizard Modal state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campSubject, setCampSubject] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campFilterType, setCampFilterType] = useState<'all' | 'selected' | 'filtered'>('all');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearchFilter, setClientSearchFilter] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Keep activeFolder in sync with query param
  useEffect(() => {
    if (folderParam && folderParam !== activeFolder) {
      setActiveFolder(folderParam);
      setSelectedUid(null);
      setFullMessage(null);
    }
  }, [folderParam]);

  // Load Starred set from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tech7_starred_emails');
      if (stored) {
        setStarredSet(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleStar = (uid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredSet((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      try {
        localStorage.setItem('tech7_starred_emails', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // ─── FETCH MESSAGES (INBOX, SENT, TRASH, STARRED) ──────────

  const loadMessages = useCallback(async () => {
    if (activeFolder === 'campaigns') {
      loadCampaigns();
      return;
    }
    if (activeFolder === 'drafts') {
      loadDrafts();
      return;
    }
    if (activeFolder === 'settings') {
      loadEmailSettings();
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const folderArg = activeFolder === 'starred' ? 'inbox' : activeFolder;
      const params = new URLSearchParams({
        folder: folderArg,
        page: String(currentPage),
        pageSize: '25',
      });
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/email/inbox?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível carregar os e-mails.');
      }

      const data = await res.json();
      let list: EmailMessage[] = data.messages || [];

      // Filter locally if starred view
      if (activeFolder === 'starred') {
        list = list.filter((m) => starredSet.has(m.uid));
      }

      setMessages(list);
      setTotalMessages(data.total || list.length);
      setSelectedUids([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar mensagens.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, currentPage, searchQuery, starredSet]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ─── FETCH DRAFTS ───────────────────────────────────────

  const loadDrafts = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/email/drafts');
      if (!res.ok) throw new Error('Não foi possível carregar os rascunhos.');
      const data = await res.json();
      setDrafts(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar rascunhos.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FETCH CAMPAIGNS ────────────────────────────────────

  const loadCampaigns = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/email/campaigns');
      if (!res.ok) throw new Error('Não foi possível carregar as campanhas.');
      const data = await res.json();
      setCampaigns(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar campanhas.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}?recipients=true`);
      if (!res.ok) throw new Error('Não foi possível carregar detalhes da campanha.');
      const data = await res.json();
      setActiveCampaignDetail({ campaign: data, recipients: data.recipients || [] });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar detalhes.');
    }
  };

  // ─── FETCH SETTINGS ──────────────────────────────────────

  const loadEmailSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/email/settings');
      if (res.ok) {
        const data = await res.json();
        setEmailSettings(data.settings);
        setAccountInfo(data.account);
        if (data.settings?.notifications?.recipientEmail) {
          setTestNotificationEmail(data.settings.notifications.recipientEmail);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de e-mail:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadEmailSettings();
  }, [loadEmailSettings]);

  const handleSaveSettings = async (partial: Partial<EmailSettings>) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar configurações.');
      }
      const data = await res.json();
      setEmailSettings(data.settings);
      setSuccessMsg('Configurações atualizadas com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUploadSignatureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setErrorMsg('Formato inválido. Use JPG, PNG, WEBP ou SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem não pode ultrapassar 5 MB.');
      return;
    }

    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'email');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro no envio da imagem.');
      }

      const data = await res.json();
      if (data.url && emailSettings) {
        const newSig = {
          ...emailSettings.signature,
          imageUrl: data.url,
        };
        await handleSaveSettings({ signature: newSig });
        setSuccessMsg('Imagem de assinatura enviada com sucesso.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar imagem de assinatura.');
    } finally {
      setUploadingSignature(false);
      e.target.value = '';
    }
  };

  const handleRemoveSignatureImage = async () => {
    if (!emailSettings) return;
    const newSig = {
      ...emailSettings.signature,
      imageUrl: '',
    };
    await handleSaveSettings({ signature: newSig });
  };

  const handleSendTestNotification = async () => {
    if (!testNotificationEmail.trim()) {
      setTestNotificationStatus('Informe um e-mail de notificação válido.');
      return;
    }
    setIsTestingNotification(true);
    setTestNotificationStatus(null);
    try {
      const res = await fetch('/api/admin/email/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testNotificationEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestNotificationStatus('Notificação enviada com sucesso.');
      } else {
        setTestNotificationStatus(data.error || 'Não foi possível enviar a notificação.');
      }
      await loadEmailSettings();
    } catch {
      setTestNotificationStatus('Não foi possível enviar a notificação.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  // ─── READ FULL MESSAGE ──────────────────────────────────

  const handleOpenMessage = async (uid: number) => {
    setSelectedUid(uid);
    setIsLoadingMessage(true);
    setErrorMsg(null);

    // Optimistically mark as read in local list
    setMessages((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, isRead: true } : m))
    );

    try {
      const res = await fetch(`/api/admin/email/message/${uid}?folder=${activeFolder}`);
      if (!res.ok) throw new Error('Não foi possível carregar o conteúdo do e-mail.');
      const data = await res.json();
      setFullMessage(data);

      // Tell IMAP to mark as read
      fetch('/api/admin/email/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', uid, folder: activeFolder }),
      }).catch(() => {});
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar a mensagem.');
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // ─── MESSAGE ACTIONS (MARK READ, UNREAD, TRASH) ──────────

  const handleAction = async (action: 'mark-read' | 'mark-unread' | 'trash', uids: number[]) => {
    if (uids.length === 0) return;
    try {
      for (const uid of uids) {
        await fetch('/api/admin/email/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, uid, folder: activeFolder }),
        });
      }

      if (action === 'trash') {
        setMessages((prev) => prev.filter((m) => !uids.includes(m.uid)));
        if (selectedUid && uids.includes(selectedUid)) {
          setSelectedUid(null);
          setFullMessage(null);
        }
      } else if (action === 'mark-read') {
        setMessages((prev) =>
          prev.map((m) => (uids.includes(m.uid) ? { ...m, isRead: true } : m))
        );
      } else if (action === 'mark-unread') {
        setMessages((prev) =>
          prev.map((m) => (uids.includes(m.uid) ? { ...m, isRead: false } : m))
        );
        if (selectedUid && uids.includes(selectedUid)) {
          setSelectedUid(null);
          setFullMessage(null);
        }
      }

      setSelectedUids([]);
      setSuccessMsg('Ação concluída com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Não foi possível executar a ação no servidor de e-mail.');
    }
  };

  // ─── COMPOSE / REPLY / FORWARD ──────────────────────────

  const handleOpenCompose = () => {
    setComposeId(null);
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    setComposeSubject('');
    setComposeAttachments([]);

    let defaultBody = 'Olá,\n\n';
    if (emailSettings?.signature?.enabled) {
      defaultBody += `\n\n${emailSettings.signature.text || 'Atenciosamente,\nTECH7 Electronics'}`;
    }
    setComposeBody(defaultBody);
    setInReplyToMsgId(undefined);
    setIsComposeOpen(true);
  };

  const handleReply = (full: EmailFull, replyAll: boolean = false) => {
    setComposeId(null);
    setComposeTo(full.fromEmail || full.from);
    if (replyAll && full.cc?.length) {
      setComposeCc(full.cc.join(', '));
    } else {
      setComposeCc('');
    }
    setComposeBcc('');
    const subj = full.subject.startsWith('Re:') ? full.subject : `Re: ${full.subject}`;
    setComposeSubject(subj);
    setInReplyToMsgId(full.messageId);
    setComposeAttachments([]);

    let replySignature = '';
    if (emailSettings?.signature?.enabled && emailSettings.signature.includeInReplies) {
      replySignature = `\n\n${emailSettings.signature.text || 'Atenciosamente,\nTECH7 Electronics'}\n`;
    }

    const quoteHeader = `\n\n\n--- Mensagem Original ---\nDe: ${full.from} <${full.fromEmail}>\nData: ${new Date(full.date).toLocaleString('pt-BR')}\nAssunto: ${full.subject}\n\n`;
    setComposeBody(`Olá,${replySignature}` + quoteHeader + (full.bodyText || ''));
    setIsComposeOpen(true);
  };

  const handleForward = (full: EmailFull) => {
    setComposeId(null);
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    const subj = full.subject.startsWith('Enc:') ? full.subject : `Enc: ${full.subject}`;
    setComposeSubject(subj);
    setInReplyToMsgId(undefined);
    setComposeAttachments([]);

    let forwardSignature = '';
    if (emailSettings?.signature?.enabled && emailSettings.signature.includeInForwards) {
      forwardSignature = `\n\n${emailSettings.signature.text || 'Atenciosamente,\nTECH7 Electronics'}\n`;
    }

    const forwardHeader = `\n\n\n--- Mensagem Encaminhada ---\nDe: ${full.from} <${full.fromEmail}>\nData: ${new Date(full.date).toLocaleString('pt-BR')}\nAssunto: ${full.subject}\nPara: ${(full.to || []).join(', ')}\n\n`;
    setComposeBody(forwardSignature + forwardHeader + (full.bodyText || ''));
    setIsComposeOpen(true);
  };

  const handleAddAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const DANGEROUS = [
      '.exe', '.bat', '.cmd', '.ps1', '.scr', '.msi', '.com', '.vbs', '.js',
      '.sh', '.bash', '.php', '.phtml', '.py', '.jar', '.dll'
    ];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (DANGEROUS.includes(ext)) {
        setErrorMsg(`Arquivo com formato executável/perigoso não permitido: ${file.name}`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`O arquivo ${file.name} excede o limite individual de 10 MB.`);
        continue;
      }
      newFiles.push(file);
    }

    setComposeAttachments((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 10) {
        setErrorMsg('Máximo de 10 anexos permitidos.');
        return combined.slice(0, 10);
      }
      return combined;
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setComposeAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveDraft = async () => {
    try {
      const res = await fetch('/api/admin/email/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: composeId || undefined,
          to: composeTo,
          cc: composeCc,
          bcc: composeBcc,
          subject: composeSubject,
          bodyHtml: composeBody.replace(/\n/g, '<br/>'),
          bodyText: composeBody,
        }),
      });
      if (!res.ok) throw new Error('Não foi possível salvar o rascunho.');
      setSuccessMsg('Rascunho salvo com sucesso.');
      setIsComposeOpen(false);
      setComposeAttachments([]);
      if (activeFolder === 'drafts') loadDrafts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar rascunho.');
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setErrorMsg('Destinatário, assunto e mensagem são obrigatórios.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    try {
      let formattedHtml = `<div style="font-family:sans-serif;font-size:14px;color:#1E293B;line-height:1.6;">${composeBody.replace(
        /\n/g,
        '<br/>'
      )}</div>`;

      // If signature image is configured and enabled, append to formatted HTML
      if (emailSettings?.signature?.enabled && emailSettings.signature.imageUrl) {
        const maxW = emailSettings.signature.maxWidth || 320;
        formattedHtml += `<div style="margin-top:20px;"><img src="${emailSettings.signature.imageUrl}" alt="Assinatura" style="max-width:${maxW}px;height:auto;" /></div>`;
      }

      const formData = new FormData();
      formData.append('to', composeTo);
      if (composeCc) formData.append('cc', composeCc);
      if (composeBcc) formData.append('bcc', composeBcc);
      formData.append('subject', composeSubject);
      formData.append('bodyHtml', formattedHtml);
      formData.append('text', composeBody);
      if (inReplyToMsgId) formData.append('inReplyTo', inReplyToMsgId);

      for (const file of composeAttachments) {
        formData.append('attachments', file);
      }

      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível enviar o e-mail.');
      }

      setSuccessMsg('E-mail enviado com sucesso.');
      setIsComposeOpen(false);
      setComposeAttachments([]);
      // If was editing a draft, delete it
      if (composeId) {
        fetch(`/api/admin/email/drafts?id=${composeId}`, { method: 'DELETE' }).catch(() => {});
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── CAMPAIGN CREATION / WIZARD ─────────────────────────

  const filteredClients = initialClients.filter((c) => {
    if (!c.isActive) return false;
    if (!clientSearchFilter.trim()) return true;
    const term = clientSearchFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.website && c.website.toLowerCase().includes(term))
    );
  });

  const getRecipientCount = () => {
    if (campFilterType === 'all') return initialClients.filter((c) => c.isActive).length;
    if (campFilterType === 'selected') return selectedClientIds.length;
    return filteredClients.length;
  };

  const handleOpenCampaignModal = (campaignToEdit?: EmailCampaign) => {
    if (campaignToEdit) {
      setEditingCampaignId(campaignToEdit.id);
      setCampName(campaignToEdit.name);
      setCampSubject(campaignToEdit.subject);
      setCampBody(campaignToEdit.bodyText || campaignToEdit.bodyHtml);
      setCampFilterType(campaignToEdit.recipientFilter.type);
      setSelectedClientIds(campaignToEdit.recipientFilter.selectedIds || []);
    } else {
      setEditingCampaignId(null);
      setCampName('');
      setCampSubject('');
      setCampBody(
        `Olá,\n\nTemos novidades exclusivas para a sua empresa na TECH7 Electronics.\nConheça nossos novos equipamentos e soluções corporativas.\n\nAtenciosamente,\nEquipe TECH7 Electronics`
      );
      setCampFilterType('all');
      setSelectedClientIds(initialClients.filter((c) => c.isActive).map((c) => c.id));
    }
    setTestEmailAddress('');
    setTestEmailStatus(null);
    setShowConfirmSend(false);
    setIsCampaignModalOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes('@')) {
      setTestEmailStatus('Informe um e-mail válido para teste.');
      return;
    }
    setIsTestingEmail(true);
    setTestEmailStatus('Enviando e-mail de teste...');
    try {
      let campId = editingCampaignId;
      if (!campId) {
        // Create draft campaign first
        const createRes = await fetch('/api/admin/email/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campName || 'Campanha de Teste',
            subject: campSubject || 'Teste de E-mail TECH7',
            bodyHtml: `<div style="font-family:sans-serif;font-size:14px;color:#1E293B;line-height:1.6;">${campBody.replace(
              /\n/g,
              '<br/>'
            )}</div>`,
            bodyText: campBody,
          }),
        });
        const created = await createRes.json();
        campId = created.id;
        setEditingCampaignId(campId);
      }

      const res = await fetch(`/api/admin/email/campaigns/${campId}?action=test`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailAddress }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao enviar e-mail de teste.');
      }
      setTestEmailStatus(`Sucesso! E-mail de teste enviado para ${testEmailAddress}.`);
    } catch (err: any) {
      setTestEmailStatus(`Erro: ${err.message}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleLaunchCampaign = async () => {
    setIsLaunchingCampaign(true);
    setErrorMsg(null);
    try {
      let campId = editingCampaignId;
      const formattedHtml = `<div style="font-family:sans-serif;font-size:14px;color:#1E293B;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E2E8F0;border-radius:8px;">
        <h2 style="color:#0F172A;font-size:18px;margin-bottom:16px;">TECH7 Electronics</h2>
        <div>${campBody.replace(/\n/g, '<br/>')}</div>
      </div>`;

      if (!campId) {
        const createRes = await fetch('/api/admin/email/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campName,
            subject: campSubject,
            bodyHtml: formattedHtml,
            bodyText: campBody,
            recipientFilter: {
              type: campFilterType,
              selectedIds: campFilterType === 'selected' ? selectedClientIds : undefined,
              filterName: campFilterType === 'filtered' ? clientSearchFilter : undefined,
            },
          }),
        });
        if (!createRes.ok) throw new Error('Não foi possível criar a campanha.');
        const created = await createRes.json();
        campId = created.id;
      }

      // Trigger send
      const sendRes = await fetch(`/api/admin/email/campaigns/${campId}?action=send`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível iniciar o envio da campanha.');
      }

      setSuccessMsg('Campanha iniciada com sucesso. O envio está sendo processado na fila.');
      setIsCampaignModalOpen(false);
      setShowConfirmSend(false);
      loadCampaigns();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao disparar campanha.');
    } finally {
      setIsLaunchingCampaign(false);
    }
  };

  const handleCancelCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}?action=cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Não foi possível cancelar a campanha.');
      setSuccessMsg('Campanha cancelada.');
      loadCampaigns();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cancelar campanha.');
    }
  };

  const switchFolder = (folder: ActiveFolder) => {
    setActiveFolder(folder);
    setSelectedUid(null);
    setFullMessage(null);
    setCurrentPage(1);
    router.push(`/admin/email?folder=${folder}`);
  };

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* ── TOP HEADER / TOOLBAR ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.titleArea}>
            <Mail size={20} color="#008744" />
            <h1 className={styles.pageTitle}>E-mail Corporativo</h1>
          </div>
          <span className={styles.accountBadge}>{mailUser}</span>
        </div>

        {activeFolder !== 'campaigns' && activeFolder !== 'settings' && (
          <div className={styles.searchBox}>
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Pesquisar por assunto ou remetente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMessages()}
              className={styles.searchInput}
            />
          </div>
        )}

        <div className={styles.topBarActions}>
          <button
            onClick={() => {
              if (activeFolder === 'settings') loadEmailSettings();
              else if (activeFolder === 'campaigns') loadCampaigns();
              else if (activeFolder === 'drafts') loadDrafts();
              else loadMessages();
            }}
            disabled={isLoading || isLoadingSettings}
            className={styles.btnIcon}
            title="Atualizar caixa de e-mail"
          >
            <RefreshCw size={15} className={isLoading || isLoadingSettings ? 'spin' : ''} />
          </button>
          {activeFolder === 'campaigns' ? (
            <button onClick={() => handleOpenCampaignModal()} className={styles.btnPrimary}>
              <Plus size={16} />
              <span>Nova Campanha</span>
            </button>
          ) : (
            <button onClick={handleOpenCompose} className={styles.btnPrimary}>
              <Plus size={16} />
              <span>Novo E-mail</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Notifications */}
      {successMsg && <div className={styles.toastSuccess}>{successMsg}</div>}
      {errorMsg && <div className={styles.toastError}>{errorMsg}</div>}

      {/* ── WORKSPACE ── */}
      <div className={styles.workspace}>
        {/* FOLDER SIDEBAR */}
        <aside className={styles.folderSidebar}>
          <button
            className={`${styles.folderBtn} ${activeFolder === 'inbox' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('inbox')}
          >
            <span className={styles.folderBtnLeft}>
              <Inbox size={16} />
              <span>Caixa de entrada</span>
            </span>
          </button>

          <button
            className={`${styles.folderBtn} ${activeFolder === 'sent' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('sent')}
          >
            <span className={styles.folderBtnLeft}>
              <Send size={16} />
              <span>Enviados</span>
            </span>
          </button>

          <button
            className={`${styles.folderBtn} ${activeFolder === 'drafts' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('drafts')}
          >
            <span className={styles.folderBtnLeft}>
              <FileEdit size={16} />
              <span>Rascunhos</span>
            </span>
            {drafts.length > 0 && <span className={styles.folderBadge}>{drafts.length}</span>}
          </button>

          <button
            className={`${styles.folderBtn} ${activeFolder === 'starred' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('starred')}
          >
            <span className={styles.folderBtnLeft}>
              <Star size={16} />
              <span>Favoritos</span>
            </span>
            {starredSet.size > 0 && <span className={styles.folderBadge}>{starredSet.size}</span>}
          </button>

          <button
            className={`${styles.folderBtn} ${activeFolder === 'trash' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('trash')}
          >
            <span className={styles.folderBtnLeft}>
              <Trash2 size={16} />
              <span>Lixeira</span>
            </span>
          </button>

          <div className={styles.folderDivider} />

          <button
            className={`${styles.folderBtn} ${activeFolder === 'campaigns' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('campaigns')}
          >
            <span className={styles.folderBtnLeft}>
              <Megaphone size={16} />
              <span>Campanhas</span>
            </span>
          </button>

          <div className={styles.folderDivider} />

          <button
            className={`${styles.folderBtn} ${activeFolder === 'settings' ? styles.folderBtnActive : ''}`}
            onClick={() => switchFolder('settings')}
          >
            <span className={styles.folderBtnLeft}>
              <Settings size={16} />
              <span>Configurações</span>
            </span>
          </button>
        </aside>

        {/* ── CONTENT PANE ── */}
        <main className={styles.contentPane}>
          {/* 0. SETTINGS VIEW */}
          {activeFolder === 'settings' ? (
            <div className={styles.settingsPane}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className={styles.settingsTitle}>Configurações de E-mail Corporativo</h2>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
                    Gerencie a conta oficial, assinatura de e-mail, canal de notificações e anexos.
                  </p>
                </div>
                <button
                  onClick={() => loadEmailSettings()}
                  disabled={isLoadingSettings}
                  className={styles.btnSecondary}
                  style={{ fontSize: 13 }}
                  title="Recarregar configurações"
                >
                  <RefreshCw size={14} className={isLoadingSettings ? 'spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>

              {/* 1. CONTA DE E-MAIL */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <div className={styles.settingsCardTitle}>
                    <Mail size={17} color="#008744" />
                    <span>Conta de E-mail</span>
                  </div>
                  <div>
                    {accountInfo?.status === 'connected' ? (
                      <span className={styles.statusConnected}>
                        <CheckCircle size={14} /> Conectado
                      </span>
                    ) : (
                      <span className={styles.statusNotConfigured}>
                        <AlertCircle size={14} /> Não configurado
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>E-mail Oficial:</span>
                    <span className={styles.formInputReadonly}>{mailUser}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Servidor IMAP:</span>
                      <span className={styles.formInputReadonly}>{accountInfo?.imapHost || 'imap.hostinger.com'} (Porta 993 SSL)</span>
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Servidor SMTP:</span>
                      <span className={styles.formInputReadonly}>{accountInfo?.smtpHost || 'smtp.hostinger.com'} (Porta 465 SSL)</span>
                    </div>
                  </div>
                  <p className={styles.settingDesc}>
                    As credenciais de segurança e senhas permanecem protegidas nas variáveis de ambiente do servidor e nunca são expostas ao navegador.
                  </p>
                </div>
              </div>

              {/* 2. ASSINATURA */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <div className={styles.settingsCardTitle}>
                    <FileEdit size={17} color="#008744" />
                    <span>Assinatura de E-mail</span>
                  </div>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={emailSettings?.signature?.enabled ?? true}
                      onChange={(e) => {
                        if (!emailSettings) return;
                        handleSaveSettings({
                          signature: { ...emailSettings.signature, enabled: e.target.checked },
                        });
                      }}
                    />
                    <span>Ativar assinatura</span>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>Texto da Assinatura:</span>
                    <textarea
                      rows={4}
                      value={emailSettings?.signature?.text ?? ''}
                      onChange={(e) => {
                        if (!emailSettings) return;
                        setEmailSettings({
                          ...emailSettings,
                          signature: { ...emailSettings.signature, text: e.target.value },
                        });
                      }}
                      onBlur={() => {
                        if (!emailSettings) return;
                        handleSaveSettings({ signature: emailSettings.signature });
                      }}
                      placeholder="Ex: Atenciosamente,&#10;Equipe TECH7 Electronics&#10;www.tech7electronics.com"
                      className={styles.formTextarea}
                      style={{ minHeight: 90 }}
                    />
                  </div>

                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>Imagem da Assinatura / Rodapé:</span>
                    <div className={styles.signaturePreviewArea}>
                      {emailSettings?.signature?.imageUrl ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={emailSettings.signature.imageUrl}
                            alt="Assinatura TECH7"
                            className={styles.signatureImgPreview}
                            style={{ maxWidth: `${emailSettings.signature.maxWidth || 320}px` }}
                          />
                          <div className={styles.uploadButtonsRow}>
                            <button
                              type="button"
                              onClick={() => signatureFileInputRef.current?.click()}
                              disabled={uploadingSignature}
                              className={styles.btnSecondary}
                              style={{ fontSize: 13 }}
                            >
                              <Upload size={14} /> {uploadingSignature ? 'Enviando...' : 'Substituir Imagem'}
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveSignatureImage}
                              className={styles.btnSecondary}
                              style={{ fontSize: 13, color: '#DC2626' }}
                            >
                              <Trash2 size={14} /> Remover Imagem
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 20 }}>
                          <ImageIcon size={32} color="#94A3B8" />
                          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                            Nenhuma imagem configurada como rodapé/assinatura.
                          </p>
                          <button
                            type="button"
                            onClick={() => signatureFileInputRef.current?.click()}
                            disabled={uploadingSignature}
                            className={styles.btnPrimary}
                            style={{ fontSize: 13 }}
                          >
                            <Upload size={14} /> {uploadingSignature ? 'Enviando...' : 'Upload da Imagem'}
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        ref={signatureFileInputRef}
                        onChange={handleUploadSignatureImage}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Largura Máxima da Imagem (px):</span>
                      <input
                        type="number"
                        min={100}
                        max={800}
                        value={emailSettings?.signature?.maxWidth ?? 320}
                        onChange={(e) => {
                          if (!emailSettings) return;
                          const val = parseInt(e.target.value, 10) || 320;
                          setEmailSettings({
                            ...emailSettings,
                            signature: { ...emailSettings.signature, maxWidth: val },
                          });
                        }}
                        onBlur={() => {
                          if (!emailSettings) return;
                          handleSaveSettings({ signature: emailSettings.signature });
                        }}
                        className={styles.formInput}
                        style={{ maxWidth: 160 }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <label className={styles.toggleLabel} style={{ fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={emailSettings?.signature?.includeInReplies ?? true}
                          onChange={(e) => {
                            if (!emailSettings) return;
                            handleSaveSettings({
                              signature: { ...emailSettings.signature, includeInReplies: e.target.checked },
                            });
                          }}
                        />
                        <span>Inserir assinatura em respostas</span>
                      </label>
                      <label className={styles.toggleLabel} style={{ fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={emailSettings?.signature?.includeInForwards ?? true}
                          onChange={(e) => {
                            if (!emailSettings) return;
                            handleSaveSettings({
                              signature: { ...emailSettings.signature, includeInForwards: e.target.checked },
                            });
                          }}
                        />
                        <span>Inserir assinatura em reencaminhamentos</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. NOTIFICAÇÕES */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <div className={styles.settingsCardTitle}>
                    <Inbox size={17} color="#008744" />
                    <span>Notificações para E-mail Pessoal</span>
                  </div>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={emailSettings?.notifications?.enabled ?? false}
                      onChange={(e) => {
                        if (!emailSettings) return;
                        handleSaveSettings({
                          notifications: { ...emailSettings.notifications, enabled: e.target.checked },
                        });
                      }}
                    />
                    <span>Ativar notificações</span>
                  </label>
                </div>

                <div className={styles.formGrid}>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    Quando chegar um novo e-mail corporativo em <strong>{mailUser}</strong>, o servidor da TECH7 detectará automaticamente a mensagem via IMAP e enviará um alerta para o seu e-mail pessoal configurado, mesmo se você fechar o navegador, sair do painel ou desligar o computador.
                  </p>

                  {!testNotificationEmail.trim() && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#B45309', fontWeight: 600 }}>
                        ⚠️ Configure um e-mail pessoal para receber notificações.
                      </p>
                    </div>
                  )}

                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>E-mail pessoal para receber notificações:</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        placeholder="seu-email-pessoal@gmail.com"
                        value={testNotificationEmail}
                        onChange={(e) => {
                          setTestNotificationEmail(e.target.value);
                          if (emailSettings) {
                            setEmailSettings({
                              ...emailSettings,
                              notifications: { ...emailSettings.notifications, recipientEmail: e.target.value },
                            });
                          }
                        }}
                        onBlur={() => {
                          if (!emailSettings) return;
                          handleSaveSettings({
                            notifications: { ...emailSettings.notifications, recipientEmail: testNotificationEmail },
                          });
                        }}
                        className={styles.formInput}
                        style={{ flex: 1, minWidth: 260 }}
                      />
                      <button
                        type="button"
                        onClick={handleSendTestNotification}
                        disabled={isTestingNotification || !testNotificationEmail.trim()}
                        className={styles.btnSecondary}
                        style={{ fontSize: 13 }}
                      >
                        <Send size={14} />
                        <span>{isTestingNotification ? 'Enviando...' : 'Enviar e-mail de teste'}</span>
                      </button>
                    </div>
                    {testNotificationStatus && (
                      <p
                        style={{
                          margin: '6px 0 0 0',
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: testNotificationStatus.includes('sucesso') ? '#166534' : '#DC2626',
                        }}
                      >
                        {testNotificationStatus}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Intervalo de Verificação (minutos):</span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={emailSettings?.notifications?.checkIntervalMinutes ?? 2}
                        onChange={(e) => {
                          if (!emailSettings) return;
                          const val = parseInt(e.target.value, 10) || 2;
                          setEmailSettings({
                            ...emailSettings,
                            notifications: { ...emailSettings.notifications, checkIntervalMinutes: val },
                          });
                        }}
                        onBlur={() => {
                          if (!emailSettings) return;
                          handleSaveSettings({ notifications: emailSettings.notifications });
                        }}
                        className={styles.formInput}
                        style={{ maxWidth: 120 }}
                      />
                      <span className={styles.settingDesc}>Executado em segundo plano no servidor Node.js.</span>
                    </div>

                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Status do Monitor Server-Side:</span>
                      <span style={{ fontSize: 12.5, color: '#334155' }}>
                        Última checagem:{' '}
                        {emailSettings?.notifications?.lastCheckAt
                          ? new Date(emailSettings.notifications.lastCheckAt).toLocaleTimeString('pt-BR')
                          : 'Pendente'}
                      </span>
                      <span className={styles.settingDesc}>
                        UIDs gravados p/ prevenir duplicatas: {emailSettings?.notifications?.notifiedUids?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Histórico / Auditoria de Notificações */}
                  <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        Registro de Notificações Enviadas (Auditoria do Servidor):
                      </span>
                      <button
                        type="button"
                        onClick={loadEmailSettings}
                        className={styles.btnSecondary}
                        style={{ padding: '3px 8px', fontSize: 11 }}
                        title="Atualizar registro"
                      >
                        <RefreshCw size={12} /> Atualizar
                      </button>
                    </div>

                    {(!emailSettings?.notifications?.logs || emailSettings.notifications.logs.length === 0) ? (
                      <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', fontStyle: 'italic' }}>
                        Nenhuma notificação registrada ainda. O histórico será listado automaticamente conforme o servidor disparar alertas.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                              <th style={{ padding: '8px 10px', color: '#475569' }}>Data/Hora</th>
                              <th style={{ padding: '8px 10px', color: '#475569' }}>Destinatário</th>
                              <th style={{ padding: '8px 10px', color: '#475569' }}>UID / ID Mensagem</th>
                              <th style={{ padding: '8px 10px', color: '#475569' }}>Assunto</th>
                              <th style={{ padding: '8px 10px', color: '#475569' }}>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emailSettings.notifications.logs.slice(0, 15).map((log) => (
                              <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#64748B' }}>
                                  {new Date(log.sentAt).toLocaleString('pt-BR')}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: 500, color: '#0F172A' }}>
                                  {log.recipientEmail}
                                </td>
                                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>
                                  {log.uid ? `UID: ${log.uid}` : (log.messageId || '-')}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {log.subject}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {log.status === 'success' ? (
                                    <span style={{ color: '#166534', fontWeight: 600, background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                                      ✓ Enviado
                                    </span>
                                  ) : (
                                    <span style={{ color: '#991B1B', fontWeight: 600, background: '#FEE2E2', padding: '2px 6px', borderRadius: 4, fontSize: 11 }} title={log.error}>
                                      ✕ Falhou: {log.error?.slice(0, 30)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. ANEXOS */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <div className={styles.settingsCardTitle}>
                    <Paperclip size={17} color="#008744" />
                    <span>Configuração de Anexos</span>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Tamanho Máximo por Arquivo:</span>
                      <span className={styles.formInputReadonly}>10 MB</span>
                    </div>
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Tamanho Máximo Total:</span>
                      <span className={styles.formInputReadonly}>25 MB</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>Tipos de Arquivos Permitidos:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'JPG', 'JPEG', 'PNG', 'WEBP', 'ZIP'].map((ext) => (
                        <span
                          key={ext}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                          }}
                        >
                          .{ext.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                      <strong>Proteção ativa contra arquivos executáveis:</strong> Arquivos com formatos executáveis ou perigosos (.exe, .bat, .cmd, .ps1, .scr, .msi, .com, .vbs, .js, .sh, etc.) e tentativas de injeção ou path traversal são terminantemente bloqueados pelo sistema tanto no navegador quanto na validação de servidor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeFolder === 'campaigns' ? (
            <div className={styles.campaignsPane}>
              <div className={styles.campaignsHeader}>
                <h2 className={styles.campaignsTitle}>Campanhas de E-mail para Clientes</h2>
                <button onClick={() => handleOpenCampaignModal()} className={styles.btnPrimary}>
                  <Plus size={16} /> Nova campanha
                </button>
              </div>

              {isLoading ? (
                <div className={styles.stateContainer}>
                  <RefreshCw size={24} className="spin" />
                  <p>Carregando campanhas...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className={styles.stateContainer}>
                  <Megaphone size={40} color="#94A3B8" />
                  <p className={styles.stateTitle}>Nenhuma campanha criada</p>
                  <p className={styles.stateSubtitle}>
                    Envie comunicados corporativos, lançamentos de produtos e informativos para a sua base de clientes cadastrada.
                  </p>
                  <button onClick={() => handleOpenCampaignModal()} className={styles.btnPrimary} style={{ marginTop: 12 }}>
                    <Plus size={15} /> Criar primeira campanha
                  </button>
                </div>
              ) : (
                <table className={styles.campaignTable}>
                  <thead>
                    <tr>
                      <th>Nome da Campanha</th>
                      <th>Assunto</th>
                      <th>Destinatários</th>
                      <th>Enviados / Falhas</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const statusClass =
                        c.status === 'draft'
                          ? styles.statusDraft
                          : c.status === 'sending'
                          ? styles.statusSending
                          : c.status === 'completed'
                          ? styles.statusCompleted
                          : c.status === 'completed_with_errors'
                          ? styles.statusErrors
                          : styles.statusCancelled;

                      const statusLabel: Record<string, string> = {
                        draft: 'Rascunho',
                        scheduled: 'Agendada',
                        sending: 'Enviando',
                        completed: 'Concluída',
                        completed_with_errors: 'Concluída c/ erros',
                        cancelled: 'Cancelada',
                      };

                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{c.subject}</td>
                          <td>{c.totalRecipients || '-'}</td>
                          <td>
                            <span style={{ color: '#166534' }}>{c.sentCount}</span> /{' '}
                            <span style={{ color: '#991B1B' }}>{c.failedCount}</span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${statusClass}`}>
                              {statusLabel[c.status] || c.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: '#64748B' }}>
                            {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => loadCampaignDetail(c.id)}
                                className={styles.btnSecondary}
                                style={{ padding: '4px 8px', fontSize: 12 }}
                                title="Ver relatório de envio"
                              >
                                <Eye size={13} />
                              </button>
                              {c.status === 'sending' && (
                                <button
                                  onClick={() => handleCancelCampaign(c.id)}
                                  className={styles.btnSecondary}
                                  style={{ padding: '4px 8px', fontSize: 12, color: '#DC2626' }}
                                  title="Cancelar envio"
                                >
                                  Cancelar
                                </button>
                              )}
                              {c.status === 'draft' && (
                                <button
                                  onClick={() => handleOpenCampaignModal(c)}
                                  className={styles.btnSecondary}
                                  style={{ padding: '4px 8px', fontSize: 12 }}
                                  title="Editar e disparar"
                                >
                                  Disparar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Campaign Recipient Logs Drawer */}
              {activeCampaignDetail && (
                <div className={styles.modalBackdrop}>
                  <div className={styles.composeModal} style={{ maxWidth: 760 }}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        Relatório: {activeCampaignDetail.campaign.name}
                      </h3>
                      <button
                        onClick={() => setActiveCampaignDetail(null)}
                        className={styles.modalCloseBtn}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div style={{ padding: 20, overflowY: 'auto', maxHeight: '70vh' }}>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
                        Total de destinatários: <strong>{activeCampaignDetail.recipients.length}</strong> |{' '}
                        Enviados: <strong style={{ color: '#166534' }}>{activeCampaignDetail.campaign.sentCount}</strong> |{' '}
                        Falhas: <strong style={{ color: '#991B1B' }}>{activeCampaignDetail.campaign.failedCount}</strong>
                      </p>
                      <table className={styles.campaignTable}>
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>E-mail</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Detalhes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeCampaignDetail.recipients.map((r) => (
                            <tr key={r.id}>
                              <td>{r.name}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.email}</td>
                              <td>
                                {r.status === 'sent' && (
                                  <span style={{ color: '#166534', fontWeight: 600 }}>Enviado</span>
                                )}
                                {r.status === 'failed' && (
                                  <span style={{ color: '#991B1B', fontWeight: 600 }}>Falhou</span>
                                )}
                                {r.status === 'pending' && (
                                  <span style={{ color: '#475569' }}>Pendente</span>
                                )}
                              </td>
                              <td style={{ fontSize: 12 }}>
                                {r.sentAt ? new Date(r.sentAt).toLocaleTimeString('pt-BR') : '-'}
                              </td>
                              <td style={{ fontSize: 11, color: '#DC2626' }}>{r.errorMessage || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : selectedUid && fullMessage ? (
            /* 2. READER VIEW */
            <div className={styles.readerView}>
              <div className={styles.readerHeader}>
                <button
                  onClick={() => {
                    setSelectedUid(null);
                    setFullMessage(null);
                  }}
                  className={styles.readerBackBtn}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar para lista</span>
                </button>

                <div className={styles.readerSubjectRow}>
                  <h2 className={styles.readerSubject}>{fullMessage.subject}</h2>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleAction('trash', [fullMessage.uid])}
                      className={styles.btnSecondary}
                      title="Excluir"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                    <button
                      onClick={() => handleAction('mark-unread', [fullMessage.uid])}
                      className={styles.btnSecondary}
                      title="Marcar como não lido"
                    >
                      Marcar não lido
                    </button>
                  </div>
                </div>

                <div className={styles.readerMetaRow}>
                  <div className={styles.readerSenderInfo}>
                    <span className={styles.readerFromName}>{fullMessage.from}</span>
                    <span className={styles.readerFromEmail}>&lt;{fullMessage.fromEmail}&gt;</span>
                    {fullMessage.to?.length > 0 && (
                      <span className={styles.readerRecipients}>
                        Para: {fullMessage.to.join(', ')}
                      </span>
                    )}
                    {fullMessage.cc?.length ? (
                      <span className={styles.readerRecipients}>
                        CC: {fullMessage.cc.join(', ')}
                      </span>
                    ) : null}
                  </div>
                  <span className={styles.readerDate}>
                    {new Date(fullMessage.date).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className={styles.readerActionsRow}>
                  <button onClick={() => handleReply(fullMessage, false)} className={styles.btnPrimary}>
                    <Reply size={15} /> Responder
                  </button>
                  {fullMessage.cc && fullMessage.cc.length > 0 && (
                    <button onClick={() => handleReply(fullMessage, true)} className={styles.btnSecondary}>
                      <Reply size={15} /> Responder a todos
                    </button>
                  )}
                  <button onClick={() => handleForward(fullMessage)} className={styles.btnSecondary}>
                    <Forward size={15} /> Encaminhar
                  </button>
                </div>
              </div>

              {/* Sanitize message body rendered in an isolated sandbox iframe */}
              <div className={styles.readerBody}>
                {fullMessage.bodyHtml ? (
                  <iframe
                    title="Conteúdo do e-mail"
                    sandbox="allow-same-origin"
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:-apple-system,sans-serif;font-size:14px;color:#1E293B;line-height:1.6;margin:0;padding:8px;}a{color:#008744;}img{max-width:100%;height:auto;}</style></head><body>${fullMessage.bodyHtml}</body></html>`}
                    className={styles.sanitizedIframe}
                  />
                ) : (
                  <pre
                    style={{
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                      fontSize: 14,
                      color: '#1E293B',
                      margin: 0,
                    }}
                  >
                    {fullMessage.bodyText || '(E-mail sem conteúdo)'}
                  </pre>
                )}
              </div>

              {fullMessage.attachments && fullMessage.attachments.length > 0 && (
                <div className={styles.readerAttachments}>
                  <div className={styles.attachmentsTitle}>
                    Anexos ({fullMessage.attachments.length})
                  </div>
                  <div className={styles.attachmentChips}>
                    {fullMessage.attachments.map((att, idx) => (
                      <span key={idx} className={styles.attachmentChip}>
                        <Paperclip size={13} color="#008744" />
                        <span>{att.filename}</span>
                        <span style={{ color: '#94A3B8', fontSize: 11 }}>
                          ({(att.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeFolder === 'drafts' ? (
            /* 3. DRAFTS VIEW */
            <div className={styles.emailList}>
              {drafts.length === 0 ? (
                <div className={styles.stateContainer}>
                  <FileEdit size={36} color="#94A3B8" />
                  <p className={styles.stateTitle}>Nenhum rascunho salvo</p>
                </div>
              ) : (
                drafts.map((d) => (
                  <div
                    key={d.id}
                    className={styles.emailItem}
                    onClick={() => {
                      setComposeId(d.id);
                      setComposeTo(d.to);
                      setComposeCc(d.cc || '');
                      setComposeBcc(d.bcc || '');
                      setComposeSubject(d.subject);
                      setComposeBody(d.bodyText || d.bodyHtml.replace(/<br\s*\/?>/g, '\n'));
                      setIsComposeOpen(true);
                    }}
                  >
                    <FileEdit size={16} color="#64748B" />
                    <span className={styles.emailFrom} style={{ color: '#0F172A' }}>
                      {d.to ? `Para: ${d.to}` : '(Sem destinatário)'}
                    </span>
                    <div className={styles.emailContentSnippet}>
                      <span className={styles.emailSubject}>{d.subject || '(Rascunho sem assunto)'}</span>
                    </div>
                    <span className={styles.emailDate}>
                      {new Date(d.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* 4. INBOX / SENT / TRASH / STARRED LIST */
            <>
              {/* Batch Action Toolbar */}
              <div className={styles.actionToolbar}>
                <div className={styles.actionToolbarLeft}>
                  <label className={styles.selectAllCheck}>
                    <input
                      type="checkbox"
                      checked={messages.length > 0 && selectedUids.length === messages.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUids(messages.map((m) => m.uid));
                        } else {
                          setSelectedUids([]);
                        }
                      }}
                    />
                    <span>Selecionar todos</span>
                  </label>

                  {selectedUids.length > 0 && (
                    <div className={styles.actionBtnGroup}>
                      <button
                        onClick={() => handleAction('mark-read', selectedUids)}
                        className={styles.btnSecondary}
                        title="Marcar selecionados como lidos"
                      >
                        <CheckCircle size={14} /> Lido
                      </button>
                      <button
                        onClick={() => handleAction('mark-unread', selectedUids)}
                        className={styles.btnSecondary}
                        title="Marcar selecionados como não lidos"
                      >
                        <XCircle size={14} /> Não lido
                      </button>
                      <button
                        onClick={() => handleAction('trash', selectedUids)}
                        className={styles.btnSecondary}
                        title="Mover selecionados para a lixeira"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.paginationInfo}>
                  <span>Total: {totalMessages} mensagens</span>
                  {totalMessages > 25 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={styles.btnSecondary}
                        style={{ padding: '2px 8px', fontSize: 11 }}
                      >
                        Anterior
                      </button>
                      <button
                        disabled={currentPage * 25 >= totalMessages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className={styles.btnSecondary}
                        style={{ padding: '2px 8px', fontSize: 11 }}
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div className={styles.emailList}>
                {isLoading ? (
                  <div className={styles.stateContainer}>
                    <RefreshCw size={26} className="spin" />
                    <p>Carregando mensagens da caixa...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.stateContainer}>
                    <Inbox size={40} color="#CBD5E1" />
                    <p className={styles.stateTitle}>Nenhuma mensagem encontrada</p>
                    <p className={styles.stateSubtitle}>
                      {activeFolder === 'starred'
                        ? 'Você não favoritou nenhuma mensagem ainda.'
                        : 'Esta pasta está vazia no momento.'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStarred = starredSet.has(msg.uid);
                    const isChecked = selectedUids.includes(msg.uid);

                    return (
                      <div
                        key={msg.uid}
                        className={`${styles.emailItem} ${!msg.isRead ? styles.emailItemUnread : ''}`}
                        onClick={() => handleOpenMessage(msg.uid)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedUids((prev) => [...prev, msg.uid]);
                            } else {
                              setSelectedUids((prev) => prev.filter((id) => id !== msg.uid));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <button
                          className={`${styles.starBtn} ${isStarred ? styles.starBtnActive : ''}`}
                          onClick={(e) => toggleStar(msg.uid, e)}
                          title={isStarred ? 'Remover favorito' : 'Favoritar'}
                        >
                          <Star size={15} fill={isStarred ? '#EAB308' : 'none'} />
                        </button>

                        <span className={styles.emailFrom}>{msg.from}</span>

                        <div className={styles.emailContentSnippet}>
                          <span className={styles.emailSubject}>{msg.subject}</span>
                          {msg.snippet && (
                            <span className={styles.emailSnippet}> — {msg.snippet}</span>
                          )}
                        </div>

                        <div className={styles.emailMeta}>
                          {msg.hasAttachments && (
                            <Paperclip size={14} className={styles.attachmentIcon} />
                          )}
                          <span className={styles.emailDate}>
                            {new Date(msg.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── COMPOSE MODAL ── */}
      {isComposeOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.composeModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {composeId ? 'Editar Rascunho' : 'Novo E-mail Corporativo'}
              </h3>
              <button onClick={() => setIsComposeOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.composeForm}>
              <div className={styles.formRow}>
                <span className={styles.formLabel}>De:</span>
                <span className={styles.formInputReadonly}>{mailUser}</span>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Para:</span>
                <input
                  type="text"
                  placeholder="destinatario@empresa.com.br"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>CC:</span>
                <input
                  type="text"
                  placeholder="Cópia (opcional)"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>CCO:</span>
                <input
                  type="text"
                  placeholder="Cópia Oculta (opcional)"
                  value={composeBcc}
                  onChange={(e) => setComposeBcc(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Assunto:</span>
                <input
                  type="text"
                  placeholder="Assunto da mensagem"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <textarea
                placeholder="Escreva sua mensagem aqui..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className={styles.formTextarea}
              />

              {/* Anexos */}
              <div className={styles.composeAttachmentsArea}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    className={styles.btnSecondary}
                    style={{ fontSize: 13, padding: '6px 12px' }}
                  >
                    <Paperclip size={14} /> Adicionar anexo
                  </button>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Máx: 10 MB / arquivo (PDF, DOC, XLS, imagens, ZIP)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  ref={composeFileInputRef}
                  onChange={handleAddAttachments}
                  style={{ display: 'none' }}
                />

                {composeAttachments.length > 0 && (
                  <div className={styles.composeAttachmentChips}>
                    {composeAttachments.map((file, idx) => (
                      <span key={idx} className={styles.composeAttachmentChip}>
                        <Paperclip size={13} style={{ color: '#008744' }} />
                        <span>{file.name}</span>
                        <span className={styles.composeAttachmentChipSize}>
                          ({file.size >= 1024 * 1024
                            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(file.size / 1024)} KB`})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className={styles.removeAttachmentBtn}
                          title="Remover anexo"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Prévia da assinatura no compositor se ativa */}
              {emailSettings?.signature?.enabled && emailSettings.signature.imageUrl && (
                <div style={{ marginTop: 12, padding: 10, background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Imagem da assinatura configurada:</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={emailSettings.signature.imageUrl} alt="Assinatura" style={{ maxHeight: 42, maxWidth: 140, objectFit: 'contain' }} />
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.modalFooterLeft}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className={styles.btnSecondary}
                  title="Salvar como rascunho"
                >
                  <FileEdit size={14} /> Salvar Rascunho
                </button>
              </div>

              <div className={styles.modalFooterRight}>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className={styles.btnPrimary}
                >
                  <SendHorizontal size={15} />
                  <span>{isSending ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN WIZARD MODAL ── */}
      {isCampaignModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.composeModal} style={{ maxWidth: 840 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCampaignId ? 'Editar Campanha de E-mail' : 'Nova Campanha de E-mail'}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.composeForm}>
              {/* Step 1: Basic Info */}
              <div className={styles.wizardStepTitle}>
                <Megaphone size={17} color="#008744" />
                <span>1. Dados da Campanha</span>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Nome:</span>
                <input
                  type="text"
                  placeholder="Ex: Lançamento Workstations 2026"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Remetente:</span>
                <span className={styles.formInputReadonly}>{mailUser} (TECH7 Electronics)</span>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Assunto:</span>
                <input
                  type="text"
                  placeholder="Ex: Soluções corporativas de alta performance para sua frota"
                  value={campSubject}
                  onChange={(e) => setCampSubject(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              {/* Step 2: Content */}
              <div className={styles.wizardStepTitle} style={{ marginTop: 12 }}>
                <FileEdit size={17} color="#008744" />
                <span>2. Conteúdo da Mensagem</span>
              </div>

              <textarea
                placeholder="Escreva o conteúdo do e-mail de marketing..."
                value={campBody}
                onChange={(e) => setCampBody(e.target.value)}
                className={styles.formTextarea}
                style={{ minHeight: 140 }}
              />

              {/* Step 3: Recipients */}
              <div className={styles.wizardStepTitle} style={{ marginTop: 12 }}>
                <Users size={17} color="#008744" />
                <span>3. Destinatários (Base de Clientes TECH7)</span>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="campFilter"
                    checked={campFilterType === 'all'}
                    onChange={() => setCampFilterType('all')}
                  />
                  <span>Todos os clientes ({initialClients.filter((c) => c.isActive).length})</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="campFilter"
                    checked={campFilterType === 'selected'}
                    onChange={() => setCampFilterType('selected')}
                  />
                  <span>Clientes selecionados</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="campFilter"
                    checked={campFilterType === 'filtered'}
                    onChange={() => setCampFilterType('filtered')}
                  />
                  <span>Filtrar por nome/e-mail</span>
                </label>
              </div>

              {campFilterType === 'filtered' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Filtrar por nome, domínio ou e-mail..."
                    value={clientSearchFilter}
                    onChange={(e) => setClientSearchFilter(e.target.value)}
                    className={styles.searchInput}
                    style={{ border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 6 }}
                  />
                </div>
              )}

              {(campFilterType === 'selected' || campFilterType === 'filtered') && (
                <div className={styles.clientSelectionBox}>
                  {filteredClients.map((client) => {
                    const isChecked = selectedClientIds.includes(client.id);
                    return (
                      <div key={client.id} className={styles.clientRow}>
                        {campFilterType === 'selected' && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClientIds((prev) => [...prev, client.id]);
                              } else {
                                setSelectedClientIds((prev) => prev.filter((id) => id !== client.id));
                              }
                            }}
                          />
                        )}
                        <span style={{ fontWeight: 600 }}>{client.name}</span>
                        <span style={{ color: '#64748B', fontSize: 12 }}>
                          {client.email || client.website || 'Sem e-mail'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.recipientCountBadge}>
                <CheckCircle size={14} />
                <span>{getRecipientCount()} destinatários selecionados</span>
              </div>

              {/* Step 4: Test Email & Device Preview */}
              <div className={styles.wizardStepTitle} style={{ marginTop: 16 }}>
                <Eye size={17} color="#008744" />
                <span>4. Teste e Visualização</span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Seu e-mail para receber teste..."
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className={styles.searchInput}
                  style={{ border: '1px solid #CBD5E1', padding: '7px 12px', borderRadius: 6, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isTestingEmail}
                  className={styles.btnSecondary}
                >
                  <Send size={14} />
                  <span>{isTestingEmail ? 'Enviando teste...' : 'Enviar e-mail de teste'}</span>
                </button>
              </div>

              {testEmailStatus && (
                <p
                  style={{
                    fontSize: 12.5,
                    color: testEmailStatus.startsWith('Sucesso') ? '#166534' : '#DC2626',
                    marginTop: 6,
                  }}
                >
                  {testEmailStatus}
                </p>
              )}

              {/* Responsive Preview */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`${styles.btnSecondary} ${previewDevice === 'desktop' ? styles.btnPrimary : ''}`}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    <Monitor size={14} /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`${styles.btnSecondary} ${previewDevice === 'mobile' ? styles.btnPrimary : ''}`}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                </div>

                <div className={styles.previewContainer}>
                  <div
                    className={
                      previewDevice === 'desktop'
                        ? styles.previewFrameDesktop
                        : styles.previewFrameMobile
                    }
                  >
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>De: {mailUser}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Para: cliente@empresa.com.br</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {campSubject || '(Sem assunto)'}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {campBody || '(Conteúdo do e-mail)'}
                    </div>
                    <div
                      style={{
                        marginTop: 24,
                        paddingTop: 12,
                        borderTop: '1px solid #E2E8F0',
                        fontSize: 11,
                        color: '#94A3B8',
                        textAlign: 'center',
                      }}
                    >
                      TECH7 Electronics — Para cancelar o recebimento de e-mails de marketing,{' '}
                      <span style={{ textDecoration: 'underline' }}>clique aqui</span>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!campName.trim() || !campSubject.trim() || !campBody.trim()) {
                    setErrorMsg('Preencha o nome, assunto e corpo da campanha.');
                    return;
                  }
                  if (getRecipientCount() === 0) {
                    setErrorMsg('Selecione pelo menos um destinatário para a campanha.');
                    return;
                  }
                  setShowConfirmSend(true);
                }}
                className={styles.btnPrimary}
              >
                <span>Avançar para Confirmação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN CONFIRMATION MODAL ── */}
      {showConfirmSend && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertCircle size={22} color="#008744" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
                Confirmar Disparo de Campanha
              </h3>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Por favor, revise atentamente os detalhes antes de confirmar o início do envio. Os e-mails serão processados em lotes controlados para proteger a reputação do domínio.
            </p>

            <table className={styles.confirmSummaryTable}>
              <tbody>
                <tr>
                  <td>Nome da Campanha:</td>
                  <td>
                    <strong>{campName}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Remetente:</td>
                  <td>{mailUser}</td>
                </tr>
                <tr>
                  <td>Assunto:</td>
                  <td>{campSubject}</td>
                </tr>
                <tr>
                  <td>Destinatários:</td>
                  <td>
                    <strong style={{ color: '#166534' }}>{getRecipientCount()} clientes</strong>
                  </td>
                </tr>
                <tr>
                  <td>Data e Hora:</td>
                  <td>{new Date().toLocaleString('pt-BR')}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowConfirmSend(false)}
                className={styles.btnSecondary}
                disabled={isLaunchingCampaign}
              >
                Voltar e revisar
              </button>
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={isLaunchingCampaign}
                className={styles.btnPrimary}
              >
                <SendHorizontal size={15} />
                <span>{isLaunchingCampaign ? 'Iniciando envio...' : 'Confirmar Envio'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
