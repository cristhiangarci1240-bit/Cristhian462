'use client';

import React, { useState } from 'react';
import { Save, Upload, CheckCircle2, Image as ImageIcon, Palette, Type } from 'lucide-react';
import { SiteSettings } from '@/lib/types';
import { useBrand } from '@/components/BrandProvider';

interface AparenciaClientProps {
  initialSettings: SiteSettings;
}

export function AparenciaClient({ initialSettings }: AparenciaClientProps) {
  const { updateLocalSettings } = useBrand();

  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [logoMobileUrl, setLogoMobileUrl] = useState(initialSettings.logoMobileUrl || initialSettings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl);
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialSettings.secondaryColor);
  const [heroTitle, setHeroTitle] = useState(initialSettings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialSettings.heroSubtitle);
  const [heroBadge, setHeroBadge] = useState(initialSettings.heroBadge);
  const [heroImage, setHeroImage] = useState(initialSettings.heroImage || '');

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (
    file: File,
    folder: string,
    setTarget: (url: string) => void,
    setLoadingState: (val: boolean) => void
  ) => {
    setLoadingState(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setTarget(data.url);
      } else {
        alert(data.error || 'Erro ao enviar imagem.');
      }
    } catch (_) {
      alert('Erro ao enviar imagem.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const payload = {
      logoUrl,
      logoMobileUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      heroTitle,
      heroSubtitle,
      heroBadge,
      heroImage,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        // Atualização instantânea em toda a aplicação via BrandProvider
        updateLocalSettings(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Erro ao salvar aparência.');
      }
    } catch (_) {
      alert('Erro ao salvar aparência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Aparência & Identidade Visual</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Personalize a logomarca oficial, favicon, cores primárias e o conteúdo de destaque da Home.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" id="btn-save-appearance">
          <Save size={16} />
          <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
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
          <span>Identidade visual e logotipo atualizados com sucesso em todo o sistema!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        {/* Coluna 1: Logos e Favicon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Logo Principal */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Logo Principal (Desktop & Rodapé)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Exibido no Cabeçalho, no Rodapé e nas comunicações da marca. Recomendado: formato SVG ou PNG transparente.
            </p>

            <div
              style={{
                height: '80px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: '#070A0E',
                border: '1px solid var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo Atual" style={{ maxHeight: '48px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/brand/logo.svg"
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Upload size={14} />
                <span>{uploadingLogo ? 'Enviando...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'marca', setLogoUrl, setUploadingLogo);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Favicon & Logo Mobile */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Favicon do Navegador</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: '#070A0E',
                  border: '1px solid var(--brand-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconUrl} alt="Favicon" style={{ maxWidth: '32px', maxHeight: '32px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'marca', setFaviconUrl, setUploadingFavicon);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cores Corporativas */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Paleta de Cores do Sistema</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Ajuste o tom exato do verde tecnológico e do fundo corporativo.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cor Primária (Verde Tecnológico)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '42px', height: '42px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cor de Fundo Principal</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ width: '42px', height: '42px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Textos e Imagem do Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Destaque da Página Inicial (Hero)</h3>

            <div className="form-group">
              <label className="form-label">Badge Superior</label>
              <input
                type="text"
                className="form-input"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Título Principal (H1)</label>
              <input
                type="text"
                required
                className="form-input"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subtítulo Explicativo</label>
              <textarea
                rows={3}
                required
                className="form-textarea"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Imagem de Destaque do Hero</label>
              <div
                style={{
                  height: '140px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: '#070A0E',
                  border: '1px dashed var(--brand-border)',
                  overflow: 'hidden',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImage} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sem imagem definida</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="URL da imagem de capa..."
                />
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Upload size={14} />
                  <span>{uploadingHero ? 'Enviando...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'marca', setHeroImage, setUploadingHero);
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
