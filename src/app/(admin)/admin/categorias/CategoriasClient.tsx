'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Upload, Save, X, Layers } from 'lucide-react';
import { Category } from '@/lib/types';

interface CategoriasClientProps {
  initialCategories: Category[];
}

export function CategoriasClient({ initialCategories }: CategoriasClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80');
    setOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setOrder(cat.order);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categorias');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        alert(data.error || 'Erro no envio da imagem.');
      }
    } catch (_) {
      alert('Erro no envio da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      description,
      image,
      order: Number(order),
      isActive,
    };

    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar categoria.');
      }

      if (editingCat) {
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? data : c)));
      } else {
        setCategories((prev) => [...prev, data]);
      }

      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${catName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(data.error || 'Erro ao remover categoria.');
      }
    } catch (_) {
      alert('Erro ao remover categoria.');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (_) {}
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Gestão de Categorias</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Defina os pilares estruturais e segmentos do catálogo corporativo da TECH7.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary" id="btn-add-category">
          <Plus size={16} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid de Categorias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ position: 'relative', height: '160px', backgroundColor: '#F1F5F9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(7, 10, 14, 0.85)',
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand-primary)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                Ordem: {cat.order}
              </span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>{cat.name}</h3>
                <button
                  onClick={() => handleToggleActive(cat)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: cat.isActive ? '#00E676' : '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title="Alternar visibilidade"
                >
                  {cat.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{cat.isActive ? 'Ativa' : 'Inativa'}</span>
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px', flex: 1 }}>
                {cat.description || 'Sem descrição cadastrada.'}
              </p>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--brand-border)' }}>
                <button
                  onClick={() => openEditModal(cat)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#EF4444' }}
                  title="Excluir categoria"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '520px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nome da categoria *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex: Celulares"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Apresentação institucional do segmento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Imagem representativa</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="URL da imagem..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Upload size={14} />
                    <span>{uploading ? 'Enviando...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ordem de exibição</label>
                  <input
                    type="number"
                    className="form-input"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  <Save size={16} />
                  <span>{loading ? 'Salvando...' : 'Salvar categoria'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
