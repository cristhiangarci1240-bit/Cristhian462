'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Save,
  X,
  Play,
  Film,
  Sparkles,
  Layers,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { Video } from '@/lib/types';

interface VideosClientProps {
  initialVideos: Video[];
}

const CATEGORY_PRESETS = [
  'LANÇAMENTO',
  'NOVO',
  'TECNOLOGIA',
  'INOVAÇÃO',
  'DESTAQUE',
  'SOLUÇÃO CORPORATIVA',
];

export function VideosClient({ initialVideos }: VideosClientProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('LANÇAMENTO');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setThumbnailUrl('');
    setCategory('LANÇAMENTO');
    setOrder(videos.length + 1);
    setIsActive(true);
    setUploadProgress('');
    setModalOpen(true);
  };

  const openEditModal = (vid: Video) => {
    setEditingVideo(vid);
    setTitle(vid.title);
    setDescription(vid.description || '');
    setVideoUrl(vid.videoUrl);
    setThumbnailUrl(vid.thumbnailUrl || '');
    setCategory(vid.category || 'LANÇAMENTO');
    setOrder(vid.order);
    setIsActive(vid.isActive);
    setUploadProgress('');
    setModalOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.mp4', '.webm', '.mov', '.ogg'].includes(ext)) {
      alert('Por favor, selecione um arquivo de vídeo válido (.mp4, .webm ou .mov).');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(`Enviando vídeo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setVideoUrl(data.url);
        setUploadProgress('Vídeo enviado com sucesso!');
      } else {
        alert(data.error || 'Erro no envio do arquivo de vídeo.');
        setUploadProgress('');
      }
    } catch {
      alert('Erro de rede ao enviar o vídeo.');
      setUploadProgress('');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'thumbnails');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setThumbnailUrl(data.url);
      } else {
        alert(data.error || 'Erro no envio da imagem de capa.');
      }
    } catch {
      alert('Erro de rede ao enviar a imagem.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert('Por favor, preencha o título e informe a URL do vídeo.');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      category: category.trim().toUpperCase(),
      order: Number(order) || 0,
      isActive,
    };

    try {
      const url = editingVideo ? `/api/videos/${editingVideo.id}` : '/api/videos';
      const method = editingVideo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar vídeo.');
      }

      if (editingVideo) {
        setVideos((prev) =>
          prev.map((v) => (v.id === editingVideo.id ? data : v)).sort((a, b) => a.order - b.order)
        );
      } else {
        setVideos((prev) => [...prev, data].sort((a, b) => a.order - b.order));
      }

      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar informações do vídeo.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (vid: Video) => {
    try {
      const res = await fetch(`/api/videos/${vid.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vid.isActive }),
      });

      if (!res.ok) {
        throw new Error('Falha ao alternar visibilidade.');
      }

      setVideos((prev) =>
        prev.map((v) => (v.id === vid.id ? { ...v, isActive: !v.isActive } : v))
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar status do vídeo.');
    }
  };

  const handleDelete = async (id: string, vidTitle: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o vídeo "${vidTitle}"?`)) return;

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir vídeo.');
      }

      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir o vídeo.');
    }
  };

  return (
    <div>
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
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Film size={24} style={{ color: 'var(--brand-primary)' }} />
            <span>Vídeos de Novos Lançamentos</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Gerencie o catálogo de vídeos em destaque exibidos na vitrine horizontal da homepage.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary"
          id="btn-add-video"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--brand-primary)',
            color: '#0B0F14',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Adicionar Vídeo</span>
        </button>
      </div>

      {/* Table / List Container */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '14px 18px', width: '90px' }}>Capa / Poster</th>
                <th style={{ padding: '14px 18px' }}>Título & Descrição</th>
                <th style={{ padding: '14px 18px', width: '150px' }}>Categoria</th>
                <th style={{ padding: '14px 18px', width: '100px' }}>Ordem</th>
                <th style={{ padding: '14px 18px', width: '120px' }}>Status</th>
                <th style={{ padding: '14px 18px', width: '130px' }}>Data</th>
                <th style={{ padding: '14px 18px', width: '130px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 18px', textAlign: 'center', color: '#94A3B8' }}>
                    <Film size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, color: '#64748B' }}>Nenhum vídeo cadastrado.</p>
                    <p style={{ fontSize: '13px' }}>Clique no botão &quot;Adicionar Vídeo&quot; acima para começar.</p>
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr
                    key={vid.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 150ms',
                    }}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '14px 18px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '84px',
                          borderRadius: '6px',
                          backgroundColor: '#0F172A',
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {vid.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Film size={20} color="#64748B" />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Play size={10} color="#00E676" style={{ marginLeft: '1px' }} />
                        </div>
                      </div>
                    </td>

                    {/* Título & Descrição */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                        {vid.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748B',
                          maxWidth: '420px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {vid.description || 'Sem descrição cadastrada.'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', fontFamily: 'monospace' }}>
                        {vid.videoUrl}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          color: '#0F172A',
                          border: '1px solid #E2E8F0',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {vid.category || 'LANÇAMENTO'}
                      </span>
                    </td>

                    {/* Ordem */}
                    <td style={{ padding: '14px 18px', color: '#475569', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ArrowUpDown size={13} color="#94A3B8" />
                        <span>{vid.order}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        onClick={() => handleToggleActive(vid)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: vid.isActive ? 'rgba(0, 230, 118, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: vid.isActive ? '#00A854' : '#DC2626',
                        }}
                        title="Clique para alternar visibilidade pública"
                      >
                        {vid.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{vid.isActive ? 'Ativo' : 'Inativo'}</span>
                      </button>
                    </td>

                    {/* Data */}
                    <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={12} color="#94A3B8" />
                        <span>
                          {vid.createdAt
                            ? new Date(vid.createdAt).toLocaleDateString('pt-BR')
                            : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(vid)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            color: '#1E293B',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Editar vídeo"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(vid.id, vid.title)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Excluir vídeo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ADICIONAR / EDITAR VÍDEO */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Film size={20} color="var(--brand-primary)" />
                <span>{editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Título */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Título do Vídeo *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Novo Ecossistema Corporativo TECH7 2026"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Categoria / Tag */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Categoria / Badge *
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: LANÇAMENTO, TECNOLOGIA, INOVAÇÃO, DESTAQUE"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {/* Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {CATEGORY_PRESETS.map((catPreset) => (
                      <button
                        key={catPreset}
                        type="button"
                        onClick={() => setCategory(catPreset)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: category === catPreset ? '#0F172A' : '#F1F5F9',
                          color: category === catPreset ? '#FFFFFF' : '#475569',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {catPreset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arquivo de Vídeo (Upload ou URL) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Arquivo de Vídeo (.mp4) *
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        cursor: uploadingVideo ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      <Upload size={14} />
                      <span>{uploadingVideo ? 'Enviando...' : 'Fazer Upload de Vídeo'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>ou insira a URL direta abaixo:</span>
                  </div>

                  <input
                    type="text"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ex: /uploads/videos/video-001.mp4 ou https://..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  {uploadProgress && (
                    <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginTop: '4px', fontWeight: 600 }}>
                      {uploadProgress}
                    </div>
                  )}
                </div>

                {/* Thumbnail / Capa (Upload ou URL) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Imagem de Capa (Thumbnail / Poster)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        cursor: uploadingThumb ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      <Upload size={14} />
                      <span>{uploadingThumb ? 'Enviando...' : 'Fazer Upload de Capa'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbUpload}
                        disabled={uploadingThumb}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>ou insira a URL da imagem:</span>
                  </div>

                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Ex: /uploads/thumbnails/capa.jpg ou URL externa"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Descrição Resumida
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição da solução ou produto apresentado no vídeo..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Ordem & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Status de Visibilidade
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '42px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: isActive ? '#00A854' : '#64748B',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
                      />
                      <span>{isActive ? 'Ativo (Exibido no site)' : 'Inativo (Oculto)'}</span>
                    </label>
                  </div>
                </div>

                {/* Preview Mini Box */}
                {(videoUrl || thumbnailUrl) && (
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '90px',
                        borderRadius: '6px',
                        backgroundColor: '#0F172A',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnailUrl}
                          alt="Prévia"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Film size={20} color="#64748B" />
                      )}
                      <Play size={12} color="#00E676" style={{ position: 'absolute' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                        {category || 'LANÇAMENTO'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                        {title || 'Título de exemplo'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {description || 'Descrição do vídeo de pré-visualização.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingVideo || uploadingThumb}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#0B0F14',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Save size={16} />
                  <span>{loading ? 'Salvando...' : 'Salvar Vídeo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
