'use client';

import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  MapPin,
  Share2,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  ShieldCheck,
  Handshake,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { SiteSettings, PartnerLogo } from '@/lib/types';
import {
  DEFAULT_PARTNERS,
  DEFAULT_PARTNERS_TITLE,
  DEFAULT_PARTNERS_TITLE_ACCENT,
  DEFAULT_PARTNERS_SUBTITLE,
} from '@/lib/partners';
import { useBrand } from '@/components/BrandProvider';

interface ConfiguracaoClientProps {
  initialSettings: SiteSettings;
}

export function ConfiguracaoClient({ initialSettings }: ConfiguracaoClientProps) {
  const { updateLocalSettings } = useBrand();

  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone);
  const [address, setAddress] = useState(initialSettings.address);
  const [linkedinUrl, setLinkedinUrl] = useState(initialSettings.linkedinUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(initialSettings.instagramUrl || '');
  const [loginLogoUrl, setLoginLogoUrl] = useState(initialSettings.loginLogoUrl || '');

  // Carrossel "Empresas com quem trabalhamos"
  const [partnersTitle, setPartnersTitle] = useState(initialSettings.partnersTitle || DEFAULT_PARTNERS_TITLE);
  const [partnersTitleAccent, setPartnersTitleAccent] = useState(
    initialSettings.partnersTitleAccent || DEFAULT_PARTNERS_TITLE_ACCENT
  );
  const [partnersSubtitle, setPartnersSubtitle] = useState(initialSettings.partnersSubtitle || DEFAULT_PARTNERS_SUBTITLE);
  const [partners, setPartners] = useState<PartnerLogo[]>(
    initialSettings.partners && initialSettings.partners.length > 0 ? initialSettings.partners : DEFAULT_PARTNERS
  );
  const [uploadingPartnerIdx, setUploadingPartnerIdx] = useState<number | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Formato de arquivo inválido. Permitido: PNG, JPG/JPEG, WEBP e SVG.');
      return;
    }

    // Validação de tamanho: máximo 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('O tamanho do arquivo excede o limite máximo permitido de 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding/login');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLoginLogoUrl(data.url);
      } else {
        alert(data.error || 'Erro no envio do logo.');
      }
    } catch {
      alert('Erro de conexão ao enviar o arquivo de logo.');
    } finally {
      setUploadingLogo(false);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleResetLogo = () => {
    setLoginLogoUrl('');
  };

  const updatePartner = (idx: number, patch: Partial<PartnerLogo>) => {
    setPartners((list) => list.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removePartner = (idx: number) => {
    setPartners((list) => list.filter((_, i) => i !== idx));
  };

  const movePartner = (idx: number, delta: number) => {
    setPartners((list) => {
      const target = idx + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handlePartnerLogoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Formato de arquivo inválido. Permitido: PNG, JPG/JPEG, WEBP e SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('O tamanho do arquivo excede o limite máximo permitido de 5MB.');
      return;
    }

    setUploadingPartnerIdx(idx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        updatePartner(idx, { logo: data.url });
      } else {
        alert(data.error || 'Erro no envio do logo.');
      }
    } catch {
      alert('Erro de conexão ao enviar o arquivo de logo.');
    } finally {
      setUploadingPartnerIdx(null);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail,
          contactPhone,
          address,
          linkedinUrl,
          instagramUrl,
          loginLogoUrl,
          partnersTitle,
          partnersTitleAccent,
          partnersSubtitle,
          partners: partners.filter((p) => p.name.trim()),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateLocalSettings(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Erro ao atualizar configurações.');
      }
    } catch (_) {
      alert('Erro ao atualizar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Configurações do Sistema</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Gerencie a identidade da tela de login, dados cadastrais e canais de contato.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" id="btn-save-settings">
          <Save size={16} />
          <span>{loading ? 'Salvando...' : 'Salvar Dados'}</span>
        </button>
      </div>

      {success && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            backgroundColor: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid #00E676',
            color: '#00E676',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Nova Seção: Logo da página de login */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ImageIcon size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              Logo da página de login
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '22px' }}>
            Personalize o logo exibido na tela de acesso administrativo.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '28px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Box Pré-visualização */}
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Pré-visualização
              </span>
              <div
                style={{
                  width: '260px',
                  height: '96px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loginLogoUrl || '/brand/logo.svg'}
                  alt="Pré-visualização do logo de login"
                  style={{
                    maxWidth: '220px',
                    maxHeight: '70px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    filter: loginLogoUrl ? 'none' : 'brightness(0)',
                  }}
                />
              </div>
              <span style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                {loginLogoUrl ? '● Logo personalizado ativo' : '● Logo padrão TECH7 em uso'}
              </span>
            </div>

            {/* Ações e Botões */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
              <label
                className="btn btn-secondary btn-sm"
                style={{
                  cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  padding: '10px 16px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 600,
                }}
              >
                <Upload size={15} />
                <span>{uploadingLogo ? 'Enviando...' : (loginLogoUrl ? 'Alterar logo' : 'Enviar logo')}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  style={{ display: 'none' }}
                />
              </label>

              {loginLogoUrl && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    color: '#DC2626',
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    fontWeight: 600,
                  }}
                  title="Restaurar logo padrão"
                >
                  <RotateCcw size={14} />
                  <span>Restaurar padrão</span>
                </button>
              )}

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '4px 0 0' }}>
                Formatos recomendados: PNG, JPG, WEBP ou SVG.<br />
                Dimensões recomendadas: até 220×70px.
              </p>
            </div>
          </div>
        </div>

        {/* Contato Institucional */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Building size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              Canais de Atendimento e Localização
            </h3>
          </div>

          <div className="grid-2-mobile" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">E-mail Institucional B2B</label>
              <input
                type="email"
                required
                className="form-input"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone Corporativo Principal</label>
              <input
                type="text"
                required
                className="form-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Endereço da Sede Operacional</label>
            <input
              type="text"
              required
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Redes Sociais */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Share2 size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              Redes Sociais Oficiais
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Página no LinkedIn Corporativo</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://linkedin.com/company/tech7-electronics"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Perfil no Instagram Oficial</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://instagram.com/tech7electronics"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Carrossel: Empresas com quem trabalhamos */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Handshake size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              Carrossel &ldquo;Empresas com quem trabalhamos&rdquo;
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '22px' }}>
            Logos exibidos na página inicial, abaixo de &ldquo;O que nossos clientes dizem&rdquo;.
          </p>

          <div className="grid-2-mobile" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input
                type="text"
                className="form-input"
                value={partnersTitle}
                onChange={(e) => setPartnersTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Título em destaque (verde)</label>
              <input
                type="text"
                className="form-input"
                value={partnersTitleAccent}
                onChange={(e) => setPartnersTitleAccent(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subtítulo</label>
            <input
              type="text"
              className="form-input"
              value={partnersSubtitle}
              onChange={(e) => setPartnersSubtitle(e.target.value)}
            />
          </div>

          <label className="form-label">Empresas ({partners.length})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {partners.map((partner, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '12px',
                  border: '1px solid var(--brand-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    width: '96px',
                    height: '52px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    flexShrink: 0,
                  }}
                >
                  {partner.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      style={{ maxWidth: '84px', maxHeight: '40px', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Sem logo</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nome da empresa"
                    value={partner.name}
                    onChange={(e) => updatePartner(idx, { name: e.target.value })}
                  />
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Site (opcional)"
                    value={partner.website || ''}
                    onChange={(e) => updatePartner(idx, { website: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <label
                    className="btn btn-secondary btn-sm"
                    style={{ cursor: uploadingPartnerIdx === idx ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Enviar logo"
                  >
                    <Upload size={14} />
                    <span>{uploadingPartnerIdx === idx ? 'Enviando...' : 'Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handlePartnerLogoUpload(idx, e)}
                      disabled={uploadingPartnerIdx !== null}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => movePartner(idx, -1)}
                    disabled={idx === 0}
                    title="Mover para cima"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => movePartner(idx, 1)}
                    disabled={idx === partners.length - 1}
                    title="Mover para baixo"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => removePartner(idx)}
                    style={{ color: '#DC2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    title="Remover"
                    aria-label="Remover empresa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPartners((list) => [...list, { name: '', logo: '' }])}
            style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Adicionar empresa</span>
          </button>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            Clique em &ldquo;Salvar Dados&rdquo; no topo da página para publicar as alterações.
          </p>
        </div>
      </div>
    </form>
  );
}
