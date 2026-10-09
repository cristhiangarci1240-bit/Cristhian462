'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Globe,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Edit3,
  DownloadCloud,
  Check,
  Image as ImageIcon,
  Star,
  Trash2,
  Link2,
  UploadCloud,
  Plus,
} from 'lucide-react';
import { Category } from '@/lib/types';
import { ImportedProduct, DuplicateMatch } from '@/lib/marketplaces/types';
import styles from './ImportProductModal.module.css';

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onProductImported: (product: any) => void;
}

export function ImportProductModal({
  isOpen,
  onClose,
  categories,
  onProductImported,
}: ImportProductModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedProduct | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Image management state (Regras 6, 7, 8, 9)
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDetect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Por favor, insira a URL do produto.');
      return;
    }

    setLoading(true);
    setError(null);
    setImported(null);
    setDuplicateMatch(null);
    setShowUrlInput(false);
    setImageUrlInput('');
    setImageError(null);

    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao consultar marketplace.');
      }

      const prod: ImportedProduct = data.product || data.data?.product;
      const dup: DuplicateMatch | null = data.duplicateMatch || data.data?.duplicateMatch || null;

      if (!prod) {
        throw new Error('Não foi possível obter os dados do produto.');
      }

      setImported(prod);
      setDuplicateMatch(dup);

      // Heurística de categoria pré-selecionada
      if (prod.suggestedCategoryId && categories.some((c) => c.id === prod.suggestedCategoryId)) {
        setSelectedCategoryId(prod.suggestedCategoryId);
      } else if (categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao processar URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imported) return;
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setImageError('A URL da imagem deve começar com http:// ou https://');
      return;
    }

    const currentImages = imported.images || [];
    setImported({
      ...imported,
      images: [...currentImages, trimmed],
    });
    setImageUrlInput('');
    setShowUrlInput(false);
    setImageError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!imported || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    setIsUploadingImage(true);
    setImageError(null);

    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`O arquivo ${file.name} ultrapassa o tamanho máximo de 10 MB.`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'produtos');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro no envio de ${file.name}.`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setImported({
          ...imported,
          images: [...(imported.images || []), ...uploadedUrls],
        });
      }
    } catch (err: any) {
      setImageError(err.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!imported) return;
    const current = [...(imported.images || [])];
    current.splice(index, 1);
    setImported({
      ...imported,
      images: current,
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    if (!imported || index === 0) return;
    const current = [...(imported.images || [])];
    const [selected] = current.splice(index, 1);
    current.unshift(selected);
    setImported({
      ...imported,
      images: current,
    });
  };

  const handleEditBeforeSave = () => {
    if (!imported) return;

    const mainImg = imported.images?.[0] || '';
    const galleryImgs = imported.images?.slice(1) || [];

    const draftData = {
      name: imported.title,
      sku: imported.sku,
      brand: imported.brand,
      model: imported.model,
      categoryId: selectedCategoryId || categories[0]?.id || '',
      shortDesc: imported.shortDescription || '',
      description: imported.description || '',
      mainImage: mainImg,
      galleryImages: galleryImgs,
      features: imported.features || [],
      specs: imported.specifications || {},
      gtin: imported.gtin || '',
      marketplace: imported.marketplace,
      sourceUrl: imported.sourceUrl,
      sourceProductId: imported.sourceProductId,
      asin: imported.asin,
      sourcePrice: imported.price,
      costPrice: imported.price, // Sugere custo base igual ao preço de compra original
      sellingPrice: imported.price ? Math.round(imported.price * 1.35 * 100) / 100 : undefined, // Margem sugerida padrão de 35%
      currency: imported.currency || 'BRL',
    };

    try {
      sessionStorage.setItem('tech7_import_draft', JSON.stringify(draftData));
    } catch (_) {}

    onClose();
    router.push('/admin/produtos/novo?imported=1');
  };

  const handleDirectImport = async () => {
    if (!imported) return;

    setSaving(true);
    setError(null);

    try {
      const mainImg =
        imported.images?.[0] ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
      const galleryImgs = imported.images?.slice(1) || [];

      const payload = {
        name: imported.title,
        sku: imported.sku,
        brand: imported.brand,
        model: imported.model,
        categoryId: selectedCategoryId || categories[0]?.id || '',
        shortDesc: imported.shortDescription || '',
        description: imported.description || '',
        mainImage: mainImg,
        galleryImages: galleryImgs,
        features: imported.features || [],
        specs: imported.specifications || {},
        order: 1,
        isActive: true,
        gtin: imported.gtin,
        marketplace: imported.marketplace,
        sourceUrl: imported.sourceUrl,
        sourceProductId: imported.sourceProductId,
        asin: imported.asin,
        sourcePrice: imported.price,
        costPrice: imported.price,
        sellingPrice: imported.price ? Math.round(imported.price * 1.35 * 100) / 100 : undefined,
        currency: imported.currency || 'BRL',
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const savedProduct = await res.json();

      if (!res.ok) {
        throw new Error(savedProduct.error || 'Erro ao salvar produto importado.');
      }

      onProductImported(savedProduct);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrap}>
              <Globe size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Importar produto por URL</h2>
              <p className={styles.subtitle}>
                Extraia especificações, imagens e detalhes oficiais via API dos marketplaces
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className={styles.body}>
          {/* Card de Entrada de URL */}
          <div className={styles.inputCard}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Link do anúncio do produto
            </label>
            <form onSubmit={handleDetect} className={styles.inputGroup}>
              <input
                type="text"
                className={styles.urlInput}
                placeholder="Cole o link do produto (Mercado Livre ou Amazon) ou código ASIN (ex: B0...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className={styles.detectBtn}
                id="btn-detect-product"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Detectando...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud size={16} />
                    <span>Detectar produto</span>
                  </>
                )}
              </button>
            </form>

            <div className={styles.supportedBadges}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Marketplaces suportados:</span>
              <span className={`${styles.badge} ${styles.mlBadge}`}>
                Mercado Livre Brasil (API Oficial)
              </span>
              <span className={`${styles.badge} ${styles.amazonBadge}`}>
                Amazon Brasil (ASIN / Creators API Opcional)
              </span>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Atenção:</strong> {error}
              </div>
            </div>
          )}

          {/* Banner de Produto Duplicado Detectado */}
          {duplicateMatch && (
            <div className={styles.duplicateBanner}>
              <div className={styles.duplicateHeader}>
                <AlertTriangle size={18} />
                <span>Produto já cadastrado no catálogo!</span>
              </div>
              <div className={styles.duplicateBody}>
                Um produto idêntico já existe no sistema:{' '}
                <strong>{duplicateMatch.name}</strong> (SKU: {duplicateMatch.sku}).
                <br />
                Critério de correspondência detectado: <em>{duplicateMatch.description || duplicateMatch.matchedBy}</em>.
              </div>
              <div className={styles.duplicateActions}>
                <a
                  href={`/admin/produtos/${duplicateMatch.id}`}
                  className="btn btn-secondary btn-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} />
                  <span>Ver produto no catálogo</span>
                </a>
              </div>
            </div>
          )}

          {/* Pré-visualização do Produto Encontrado */}
          {imported && (
            <div className={styles.previewCard}>
              {/* Aviso Não Bloqueante para Modo Manual / ASIN */}
              {imported.notice && (
                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={17} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: '1.45' }}>
                    <strong>Modo ASIN/Manual:</strong> {imported.notice}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className={`${styles.badge} ${
                    imported.marketplace === 'mercadolivre' ? styles.mlBadge : styles.amazonBadge
                  }`}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  {imported.marketplace === 'mercadolivre' ? 'Mercado Livre Brasil' : 'Amazon Brasil'}
                </span>
                <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> Dados identificados com sucesso
                </span>
              </div>

              <div className={styles.previewTop}>
                <div className={styles.imageWrap}>
                  {imported.images && imported.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imported.images[0]} alt={imported.title} className={styles.thumbImg} />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '10px',
                        background: '#F8FAFC',
                      }}
                    >
                      <ImageIcon size={26} style={{ color: '#94A3B8', marginBottom: '4px' }} />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Sem imagem</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>Adicione abaixo</span>
                    </div>
                  )}
                  {imported.images && imported.images[0] && (
                    <span className={styles.galleryPill} style={{ background: '#059669', color: '#FFFFFF' }}>
                      Principal
                    </span>
                  )}
                </div>

                <div className={styles.details}>
                  {imported.isManualMode ? (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                        Título do Produto (editável)
                      </label>
                      <input
                        type="text"
                        value={imported.title}
                        onChange={(e) => setImported({ ...imported, title: e.target.value })}
                        className="form-input"
                        style={{ width: '100%', fontSize: '13.5px', fontWeight: 600, padding: '5px 8px' }}
                      />
                    </div>
                  ) : (
                    <h3 className={styles.productTitle}>{imported.title}</h3>
                  )}

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Marca</span>
                      <span className={styles.metaValue}>{imported.brand || 'Não informada'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Modelo</span>
                      <span className={styles.metaValue}>{imported.model || 'Padrão'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>SKU Sugerido</span>
                      <span className={styles.metaValue}>{imported.sku}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>GTIN / EAN</span>
                      <span className={styles.metaValue}>{imported.gtin || 'Não informado'}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                        Preço no marketplace
                      </span>
                      <span className={styles.priceTag}>{formatPrice(imported.price)}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                        Categoria de destino
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="form-select"
                        style={{ padding: '6px 10px', fontSize: '12.5px' }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <a
                    href={imported.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    <span>Ver anúncio original no marketplace</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* ── SEÇÃO: IMAGEM DO PRODUTO (UX PROFISSIONAL) ── */}
              <div className={styles.imageManager}>
                <div className={styles.imageManagerHeader}>
                  <div className={styles.imageManagerTitle}>
                    <ImageIcon size={16} style={{ color: '#008744' }} />
                    <span>Imagem do produto ({imported.images?.length || 0})</span>
                  </div>

                  <div className={styles.imageActionBtns}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUrlInput(!showUrlInput);
                        setImageError(null);
                      }}
                      className={styles.imageActionBtn}
                      id="btn-add-image-url"
                    >
                      <Link2 size={13} />
                      <span>Adicionar por URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className={styles.imageActionBtn}
                      id="btn-upload-image-file"
                    >
                      {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                      <span>{isUploadingImage ? 'Enviando...' : 'Enviar imagem'}</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      multiple
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Input inline para Adicionar por URL */}
                {showUrlInput && (
                  <form onSubmit={handleAddImageUrl} className={styles.urlInputRow}>
                    <input
                      type="url"
                      placeholder="Cole o link da imagem (ex: https://m.media-amazon.com/...)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className={styles.urlConfirmBtn} disabled={!imageUrlInput.trim()}>
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUrlInput(false);
                        setImageUrlInput('');
                        setImageError(null);
                      }}
                      className={styles.urlCancelBtn}
                    >
                      Cancelar
                    </button>
                  </form>
                )}

                {/* Mensagem de Erro de Imagem */}
                {imageError && (
                  <div style={{ color: '#DC2626', fontSize: '12px', background: '#FEF2F2', padding: '6px 10px', borderRadius: '4px' }}>
                    ⚠️ {imageError}
                  </div>
                )}

                {/* Grid de Imagens / Galeria */}
                {imported.images && imported.images.length > 0 ? (
                  <div className={styles.imageGrid}>
                    {imported.images.map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className={`${styles.imageCard} ${idx === 0 ? styles.imageCardPrimary : ''}`}
                      >
                        <div className={styles.imageCardThumbWrap}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Foto ${idx + 1}`} className={styles.imageCardThumb} />

                          {idx === 0 ? (
                            <span className={styles.imageCardBadgePrimary}>
                              <Star size={10} fill="#FFFFFF" /> Imagem principal
                            </span>
                          ) : (
                            <span className={styles.imageCardBadgeAdditional}>
                              Imagens adicionais
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className={styles.imageCardDeleteBtn}
                            title="Remover esta imagem"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {idx > 0 && (
                          <div className={styles.imageCardFooter}>
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className={styles.setPrimaryBtn}
                            >
                              Tornar principal
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.imageEmptyState}>
                    <ImageIcon size={26} style={{ color: '#94A3B8' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                      Nenhuma imagem adicionada ainda.
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Adicione uma imagem por link direto ou envie uma foto do seu computador pelos botões acima.
                    </span>
                  </div>
                )}
              </div>

              {/* Características e Descrição */}
              {imported.features && imported.features.length > 0 && (
                <div>
                  <h4 className={styles.sectionTitle}>Principais Características</h4>
                  <ul className={styles.featuresList}>
                    {imported.features.slice(0, 5).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Especificações Técnicas */}
              {imported.specifications && Object.keys(imported.specifications).length > 0 && (
                <div>
                  <h4 className={styles.sectionTitle}>
                    Especificações Técnicas ({Object.keys(imported.specifications).length})
                  </h4>
                  <table className={styles.specsTable}>
                    <tbody>
                      {Object.entries(imported.specifications).slice(0, 6).map(([key, val]) => (
                        <tr key={key}>
                          <th>{key}</th>
                          <td>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className={styles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>

          {imported && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEditBeforeSave}
                disabled={saving}
                id="btn-edit-before-save"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={15} />
                <span>Editar antes de salvar</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDirectImport}
                disabled={saving}
                id="btn-confirm-import"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Importar produto</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
