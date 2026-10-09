'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Globe,
  Info,
} from 'lucide-react';
import { Product, Category } from '@/lib/types';

interface ProductFormProps {
  categories: Category[];
  initialProduct?: Product | null;
}

export function ProductForm({ categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [brand, setBrand] = useState(initialProduct?.brand || 'TECH7');
  const [model, setModel] = useState(initialProduct?.model || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || categories[0]?.id || '');
  const [shortDesc, setShortDesc] = useState(initialProduct?.shortDesc || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [mainImage, setMainImage] = useState(initialProduct?.mainImage || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(initialProduct?.galleryImages || []);
  const [order, setOrder] = useState<number>(initialProduct?.order || 1);
  const [isActive, setIsActive] = useState<boolean>(initialProduct ? initialProduct.isActive : true);

  // Marketplace e Rastreabilidade
  const [gtin, setGtin] = useState(initialProduct?.gtin || '');
  const [marketplace, setMarketplace] = useState<string | undefined>(
    initialProduct?.marketplace
  );
  const [sourceUrl, setSourceUrl] = useState(initialProduct?.sourceUrl || '');
  const [sourceProductId, setSourceProductId] = useState(initialProduct?.sourceProductId || '');
  const [asin, setAsin] = useState(initialProduct?.asin || '');

  // Controle de Preço e Margem (Fase 2)
  const [costPrice, setCostPrice] = useState<number | ''>(
    initialProduct?.costPrice !== undefined ? initialProduct.costPrice : ''
  );
  const [sourcePrice, setSourcePrice] = useState<number | ''>(
    initialProduct?.sourcePrice !== undefined ? initialProduct.sourcePrice : ''
  );
  const [sellingPrice, setSellingPrice] = useState<number | ''>(
    initialProduct?.sellingPrice !== undefined ? initialProduct.sellingPrice : ''
  );
  const [minMarginPercent, setMinMarginPercent] = useState<number | ''>(
    initialProduct?.minMarginPercent !== undefined ? initialProduct.minMarginPercent : 20
  );
  const [targetMarginPercent, setTargetMarginPercent] = useState<number | ''>(
    initialProduct?.targetMarginPercent !== undefined ? initialProduct.targetMarginPercent : 35
  );
  const [maxPurchasePrice, setMaxPurchasePrice] = useState<number | ''>(
    initialProduct?.maxPurchasePrice !== undefined ? initialProduct.maxPurchasePrice : ''
  );
  const [minSellingPrice, setMinSellingPrice] = useState<number | ''>(
    initialProduct?.minSellingPrice !== undefined ? initialProduct.minSellingPrice : ''
  );
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(
    initialProduct?.currency === 'USD' ? 'USD' : 'BRL'
  );

  // Características dinâmicas
  const [features, setFeatures] = useState<string[]>(
    initialProduct?.features?.length ? initialProduct.features : ['']
  );

  // Especificações técnicas (chave-valor)
  const initialSpecsArray = initialProduct?.specs
    ? Object.entries(initialProduct.specs).map(([key, value]) => ({ key, value }))
    : [
        { key: 'Processador', value: '' },
        { key: 'Memória RAM', value: '' },
        { key: 'Armazenamento', value: '' },
        { key: 'Garantia Corporativa', value: '24 meses' },
      ];

  const [specsList, setSpecsList] = useState<{ key: string; value: string }[]>(initialSpecsArray);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);

  // Carregar rascunho de importação do sessionStorage (se houver)
  useEffect(() => {
    if (!isEditing && typeof window !== 'undefined') {
      try {
        const rawDraft = sessionStorage.getItem('tech7_import_draft');
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.name) setName(draft.name);
          if (draft.sku) setSku(draft.sku);
          if (draft.brand) setBrand(draft.brand);
          if (draft.model) setModel(draft.model);
          if (draft.categoryId) setCategoryId(draft.categoryId);
          if (draft.shortDesc) setShortDesc(draft.shortDesc);
          if (draft.description) setDescription(draft.description);
          if (draft.mainImage) setMainImage(draft.mainImage);
          if (Array.isArray(draft.galleryImages) && draft.galleryImages.length) {
            setGalleryImages(draft.galleryImages);
          }
          if (Array.isArray(draft.features) && draft.features.length) {
            setFeatures(draft.features);
          }
          if (draft.specs && Object.keys(draft.specs).length) {
            setSpecsList(Object.entries(draft.specs).map(([key, value]) => ({ key, value: String(value) })));
          }
          if (draft.gtin) setGtin(draft.gtin);
          if (draft.marketplace) setMarketplace(draft.marketplace);
          if (draft.sourceUrl) setSourceUrl(draft.sourceUrl);
          if (draft.sourceProductId) setSourceProductId(draft.sourceProductId);
          if (draft.asin) setAsin(draft.asin);
          if (draft.costPrice !== undefined) setCostPrice(draft.costPrice);
          if (draft.sourcePrice !== undefined) setSourcePrice(draft.sourcePrice);
          if (draft.sellingPrice !== undefined) setSellingPrice(draft.sellingPrice);
          if (draft.currency) setCurrency(draft.currency);

          const marketName = draft.marketplace === 'mercadolivre' ? 'Mercado Livre Brasil' : 'Amazon Brasil';
          setDraftBanner(`Dados importados do ${marketName}. Você pode revisar e editar todos os campos antes de salvar.`);
          sessionStorage.removeItem('tech7_import_draft');
        }
      } catch (_) {}
    }
  }, [isEditing]);

  // Cálculos de Margem e Preço em Tempo Real
  const numCost = costPrice !== '' ? Number(costPrice) : 0;
  const numSelling = sellingPrice !== '' ? Number(sellingPrice) : 0;
  const numMinSelling = minSellingPrice !== '' ? Number(minSellingPrice) : null;
  const numMaxCost = maxPurchasePrice !== '' ? Number(maxPurchasePrice) : null;
  const numMinMargin = minMarginPercent !== '' ? Number(minMarginPercent) : null;

  const lucroBruto = numSelling > 0 && numCost > 0 ? numSelling - numCost : null;
  const margemPercentual =
    numSelling > 0 && numCost > 0 ? ((numSelling - numCost) / numSelling) * 100 : null;
  const markupPercentual =
    numCost > 0 && numSelling > 0 ? ((numSelling - numCost) / numCost) * 100 : null;

  const avisoPrecoAbaixoPiso = numSelling > 0 && numMinSelling !== null && numSelling < numMinSelling;
  const avisoCustoAcimaTeto = numCost > 0 && numMaxCost !== null && numCost > numMaxCost;
  const avisoMargemBaixa =
    margemPercentual !== null && numMinMargin !== null && margemPercentual < numMinMargin;

  const formatCurrency = (val: number | null) => {
    if (val === null || isNaN(val)) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'BRL',
    }).format(val);
  };

  // Adicionar / Remover Característica
  const handleAddFeature = () => setFeatures([...features, '']);
  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Adicionar / Remover Especificação Técnica
  const handleAddSpec = () => setSpecsList([...specsList, { key: '', value: '' }]);
  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specsList];
    updated[index][field] = val;
    setSpecsList(updated);
  };
  const handleRemoveSpec = (index: number) => {
    setSpecsList(specsList.filter((_, i) => i !== index));
  };

  // Upload de Imagem Principal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'produtos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setMainImage(data.url);
      } else {
        alert(data.error || 'Erro no envio da imagem.');
      }
    } catch (_) {
      alert('Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Formatar especificações como objeto
    const specsObj: Record<string, string> = {};
    specsList.forEach((item) => {
      if (item.key.trim()) {
        specsObj[item.key.trim()] = item.value.trim();
      }
    });

    const payload = {
      name,
      sku,
      brand,
      model,
      categoryId,
      shortDesc,
      description,
      features: features.filter((f) => f.trim() !== ''),
      specs: specsObj,
      mainImage:
        mainImage ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      galleryImages,
      order: Number(order),
      isActive,
      // Marketplace e Rastreabilidade
      gtin: gtin.trim() || undefined,
      marketplace,
      sourceUrl: sourceUrl.trim() || undefined,
      sourceProductId: sourceProductId.trim() || undefined,
      asin: asin.trim() || undefined,
      // Controle de Preço e Margem
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      sourcePrice: sourcePrice !== '' ? Number(sourcePrice) : undefined,
      sellingPrice: sellingPrice !== '' ? Number(sellingPrice) : undefined,
      minMarginPercent: minMarginPercent !== '' ? Number(minMarginPercent) : undefined,
      targetMarginPercent: targetMarginPercent !== '' ? Number(targetMarginPercent) : undefined,
      maxPurchasePrice: maxPurchasePrice !== '' ? Number(maxPurchasePrice) : undefined,
      minSellingPrice: minSellingPrice !== '' ? Number(minSellingPrice) : undefined,
      currency,
    };

    try {
      const url = isEditing ? `/api/products/${initialProduct?.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar produto.');
      }

      setMessage({ type: 'success', text: 'Produto salvo com sucesso!' });
      setTimeout(() => {
        router.push('/admin/produtos');
        router.refresh();
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao processar dados.' });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '1100px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/admin/produtos" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
            {isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/produtos" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary" id="btn-save-product">
            <Save size={16} />
            <span>{loading ? 'Salvando...' : 'Salvar produto'}</span>
          </button>
        </div>
      </div>

      {/* Banner de Rascunho Importado */}
      {draftBanner && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <Globe size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
          <span>{draftBanner}</span>
        </div>
      )}

      {message && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            backgroundColor:
              message.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#00E676' : '#EF4444'}`,
            color: message.type === 'success' ? '#00E676' : '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid Principal do Formulário */}
      <div className="grid-main-side-mobile" style={{ gap: '28px' }}>
        {/* Coluna Esquerda: Informações e Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Dados Gerais */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Informações Principais
            </h3>

            <div className="form-group">
              <label className="form-label">Nome do produto *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ex: Workstation Pro Desk Ultra 16-Core"
                value={name}
                onChange={(e) => setName(e.target.value)}
                id="input-product-name"
              />
            </div>

            <div className="grid-2-mobile" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">SKU (Código Corporativo) *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex: T7-WS-16C"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  id="input-product-sku"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria *</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  id="select-product-category"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3-mobile" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Marca</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: TECH7 Computing"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modelo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: UD-9000X Pro"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GTIN / Código EAN</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 7891234567890"
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição curta (Resumo do catálogo)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Resumo em 1 frase para o cartão do produto..."
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição completa *</label>
              <textarea
                rows={4}
                required
                className="form-textarea"
                placeholder="Apresentação detalhada do produto, diferenciais e conformidade corporativa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Controle de Preço e Margem Comercial (Fase 2) */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <TrendingUp size={18} style={{ color: '#00E676' }} />
                  <span>Controle de Preço e Margem Comercial</span>
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Gerencie custos, preços de venda e métricas financeiras em tempo real.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Moeda:
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'BRL' | 'USD')}
                  className="form-select"
                  style={{ width: '95px', padding: '4px 8px', fontSize: '12px' }}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Preços Básicos */}
            <div className="grid-3-mobile" style={{ gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Preço de custo ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0,00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  id="input-cost-price"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custo de aquisição</span>
              </div>

              <div className="form-group">
                <label className="form-label">Preço no fornecedor ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0,00"
                  value={sourcePrice}
                  onChange={(e) => setSourcePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  id="input-source-price"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Preço no marketplace original</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: '#00E676' }}>
                  Preço de venda TECH7 ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0,00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  id="input-selling-price"
                  style={{ borderColor: 'rgba(0, 230, 118, 0.5)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Preço final no catálogo</span>
              </div>
            </div>

            {/* Metas e Limites */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div className="form-group">
                <label className="form-label">Margem mínima (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="Ex: 20"
                  value={minMarginPercent}
                  onChange={(e) =>
                    setMinMarginPercent(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Margem alvo (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="Ex: 35"
                  value={targetMarginPercent}
                  onChange={(e) =>
                    setTargetMarginPercent(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Piso de venda ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="Mínimo permitido"
                  value={minSellingPrice}
                  onChange={(e) =>
                    setMinSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teto de compra ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="Máximo permitido"
                  value={maxPurchasePrice}
                  onChange={(e) =>
                    setMaxPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Painel de Métricas em Tempo Real */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '12px',
                backgroundColor: 'var(--brand-surface)',
                border: '1px solid var(--brand-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                  }}
                >
                  Lucro Bruto Estimado
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: lucroBruto !== null && lucroBruto >= 0 ? '#00E676' : '#EF4444',
                  }}
                >
                  {formatCurrency(lucroBruto)}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>
                  por unidade
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                  }}
                >
                  Margem de Lucro (%)
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: margemPercentual !== null && margemPercentual >= 0 ? '#00E676' : '#EF4444',
                  }}
                >
                  {margemPercentual !== null ? `${margemPercentual.toFixed(1)}%` : '—'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>
                  sobre preço de venda
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                  }}
                >
                  Markup (%)
                </span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: markupPercentual !== null && markupPercentual >= 0 ? '#60A5FA' : '#EF4444',
                  }}
                >
                  {markupPercentual !== null ? `${markupPercentual.toFixed(1)}%` : '—'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block' }}>
                  sobre preço de custo
                </span>
              </div>
            </div>

            {/* Alertas Dinâmicos de Conformidade Comercial */}
            {(avisoPrecoAbaixoPiso || avisoCustoAcimaTeto || avisoMargemBaixa) && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {avisoPrecoAbaixoPiso && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid #EF4444',
                      borderRadius: '4px',
                      color: '#F87171',
                      fontSize: '12px',
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>
                      <strong>Alerta:</strong> Preço de venda ({formatCurrency(numSelling)}) está abaixo do piso mínimo configurado ({formatCurrency(numMinSelling)}).
                    </span>
                  </div>
                )}
                {avisoCustoAcimaTeto && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid #EF4444',
                      borderRadius: '4px',
                      color: '#F87171',
                      fontSize: '12px',
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>
                      <strong>Alerta:</strong> Preço de custo ({formatCurrency(numCost)}) excede o teto de compra permitido ({formatCurrency(numMaxCost)}).
                    </span>
                  </div>
                )}
                {avisoMargemBaixa && !avisoPrecoAbaixoPiso && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid #F59E0B',
                      borderRadius: '4px',
                      color: '#FBBF24',
                      fontSize: '12px',
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>
                      <strong>Aviso:</strong> A margem calculada ({margemPercentual?.toFixed(1)}%) é inferior à meta mínima definida ({minMarginPercent}%).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Características Principais */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Características Principais</h3>
              <button
                type="button"
                onClick={handleAddFeature}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Adicionar item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Recurso corporativo ${idx + 1}`}
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Especificações Técnicas (Chave-Valor) */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Especificações Técnicas</h3>
              <button
                type="button"
                onClick={handleAddSpec}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Adicionar linha
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {specsList.map((spec, idx) => (
                <div
                  key={idx}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr) auto', gap: '8px' }}
                >
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Parâmetro (Ex: Memória)"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Valor (Ex: 64 GB DDR5)"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Imagem, Rastreabilidade e Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Rastreabilidade Marketplace (se aplicável) */}
          {(marketplace || sourceUrl) && (
            <div
              style={{
                backgroundColor: 'var(--brand-surface-card)',
                border: '1px solid var(--brand-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Globe size={16} style={{ color: '#2563EB' }} />
                <span>Origem do Marketplace</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Plataforma:</span>
                  <span style={{ fontWeight: 600 }}>
                    {marketplace === 'mercadolivre' ? 'Mercado Livre Brasil' : marketplace === 'amazon' ? 'Amazon Brasil' : 'Manual'}
                  </span>
                </div>

                {sourceProductId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ID Original:</span>
                    <span style={{ fontWeight: 600 }}>{sourceProductId}</span>
                  </div>
                )}

                {asin && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ASIN:</span>
                    <span style={{ fontWeight: 600 }}>{asin}</span>
                  </div>
                )}

                {sourceUrl && (
                  <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--brand-border)' }}>
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#2563EB',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <span>Ver anúncio de compra</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Imagem Principal */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Imagem Principal</h3>

            <div
              style={{
                width: '100%',
                height: '200px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-surface)',
                border: '1px dashed var(--brand-border)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainImage}
                  alt="Pré-visualização"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <span style={{ fontSize: '13px' }}>Sem imagem selecionada</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                <Upload size={14} />
                <span>{uploading ? 'Enviando imagem...' : 'Fazer upload de foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <input
                type="text"
                placeholder="Ou informe a URL da imagem..."
                className="form-input"
                style={{ fontSize: '12.5px' }}
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
              />
            </div>
          </div>

          {/* Status e Visibilidade */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Status e Exibição
            </h3>

            <div className="form-group">
              <label className="form-label">Status no Catálogo</label>
              <select
                className="form-select"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Ativo (Visível na loja)</option>
                <option value="false">Inativo (Rascunho oculto)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ordem de exibição</label>
              <input
                type="number"
                className="form-input"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                min={0}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Menor número aparece primeiro no catálogo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
