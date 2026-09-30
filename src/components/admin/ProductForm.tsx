'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';
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
      mainImage: mainImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      galleryImages,
      order: Number(order),
      isActive,
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
    <form onSubmit={handleSubmit} style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
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

      {message && (
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            backgroundColor: message.type === 'success' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Informações Principais</h3>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

          {/* Características Principais */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px' }}>
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

        {/* Coluna Direita: Imagem e Configurações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', textAlign: 'center' }}>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Status e Exibição</h3>

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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Menor número aparece primeiro no catálogo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
