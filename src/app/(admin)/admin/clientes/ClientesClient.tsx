'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Upload, Save, X, ExternalLink } from 'lucide-react';
import { Client } from '@/lib/types';

interface ClientesClientProps {
  initialClients: Client[];
}

export function ClientesClient({ initialClients }: ClientesClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [website, setWebsite] = useState('');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingClient(null);
    setName('');
    setLogo('https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=300&q=80');
    setWebsite('');
    setOrder(clients.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cli: Client) => {
    setEditingClient(cli);
    setName(cli.name);
    setLogo(cli.logo);
    setWebsite(cli.website || '');
    setOrder(cli.order);
    setIsActive(cli.isActive);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'clientes');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLogo(data.url);
      } else {
        alert(data.error || 'Erro no envio do logo.');
      }
    } catch (_) {
      alert('Erro no envio do logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      logo,
      website,
      order: Number(order),
      isActive,
    };

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar cliente.');
      }

      if (editingClient) {
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? data : c)));
      } else {
        setClients((prev) => [...prev, data]);
      }

      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover "${clientName}" da lista de parceiros?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Erro ao excluir cliente.');
      }
    } catch (_) {
      alert('Erro ao excluir cliente.');
    }
  };

  const handleToggleActive = async (cli: Client) => {
    try {
      const res = await fetch(`/api/clients/${cli.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cli.isActive }),
      });

      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === cli.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (_) {}
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Empresas que Confiam em Nós</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Gerencie os parceiros e logos corporativos exibidos no portal público.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary" id="btn-add-client">
          <Plus size={16} />
          <span>Adicionar Cliente</span>
        </button>
      </div>

      {/* Grid de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
        {clients.map((cli) => (
          <div
            key={cli.id}
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                height: '80px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--brand-surface)',
                border: '1px solid var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cli.logo}
                alt={cli.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-white)' }}>{cli.name}</h4>
                <button
                  onClick={() => handleToggleActive(cli)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: cli.isActive ? '#00E676' : '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title="Alternar visibilidade"
                >
                  {cli.isActive ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  <span>{cli.isActive ? 'Ativo' : 'Inativo'}</span>
                </button>
              </div>

              {cli.website && (
                <a
                  href={cli.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--brand-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{cli.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--brand-border)', marginTop: 'auto' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Ordem: <strong>{cli.order}</strong>
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(cli)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px' }}
                  title="Editar cliente"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cli.id, cli.name)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', color: '#EF4444' }}
                  title="Excluir cliente"
                >
                  <Trash2 size={13} />
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
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                {editingClient ? 'Editar Cliente' : 'Adicionar Cliente'}
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
                <label className="form-label">Nome da Empresa / Cliente *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ex: Nexus Corp Inovação"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website Oficial</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://empresa.com.br"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Logo da Empresa *</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="URL do logo..."
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
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

              <div className="grid-2-mobile" style={{ gap: '16px', marginBottom: '24px' }}>
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
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
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
                  <span>{loading ? 'Salvando...' : 'Salvar cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
