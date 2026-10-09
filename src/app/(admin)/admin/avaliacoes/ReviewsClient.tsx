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
  Star,
  MessageSquare,
  ArrowUpDown,
  ShieldCheck,
} from 'lucide-react';
import { Review } from '@/lib/types';

interface ReviewsClientProps {
  initialReviews: Review[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewDate, setReviewDate] = useState('Recentemente');
  const [isVerified, setIsVerified] = useState(true);
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingReview(null);
    setCustomerName('');
    setCompanyName('');
    setAvatarUrl('');
    setRating(5);
    setComment('');
    setReviewDate('Recentemente');
    setIsVerified(true);
    setOrder(reviews.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (rev: Review) => {
    setEditingReview(rev);
    setCustomerName(rev.customerName);
    setCompanyName(rev.companyName || '');
    setAvatarUrl(rev.avatarUrl || '');
    setRating(rev.rating);
    setComment(rev.comment);
    setReviewDate(rev.reviewDate || '');
    setIsVerified(rev.isVerified ?? true);
    setOrder(rev.order);
    setIsActive(rev.isActive);
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avaliacoes');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      } else {
        alert(data.error || 'Erro no envio da foto de perfil.');
      }
    } catch {
      alert('Erro de conexão ao enviar a imagem.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      alert('Por favor, informe o nome do cliente e o comentário da avaliação.');
      return;
    }

    setLoading(true);

    const payload = {
      customerName: customerName.trim(),
      companyName: companyName.trim(),
      avatarUrl: avatarUrl.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      reviewDate: reviewDate.trim() || 'Recentemente',
      isVerified,
      order: Number(order) || 0,
      isActive,
    };

    try {
      const url = editingReview ? `/api/reviews/${editingReview.id}` : '/api/reviews';
      const method = editingReview ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar avaliação.');
      }

      if (editingReview) {
        setReviews((prev) =>
          prev.map((r) => (r.id === editingReview.id ? data : r)).sort((a, b) => a.order - b.order)
        );
      } else {
        setReviews((prev) => [...prev, data].sort((a, b) => a.order - b.order));
      }

      setModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar informações da avaliação.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (rev: Review) => {
    try {
      const res = await fetch(`/api/reviews/${rev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rev.isActive }),
      });

      if (!res.ok) {
        throw new Error('Falha ao alternar status da avaliação.');
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao alternar status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza de que deseja excluir a avaliação de "${name}"?`)) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir avaliação.');
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir a avaliação.');
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
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Star size={24} style={{ color: 'var(--brand-primary)' }} />
            <span>Avaliações de Clientes (Prova Social)</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Gerencie os depoimentos, notas de avaliação e prova social corporativa exibidos na homepage.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary"
          id="btn-add-review"
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
          <span>Adicionar Avaliação</span>
        </button>
      </div>

      {/* Table List Container */}
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
                <th style={{ padding: '14px 18px', width: '60px' }}>Foto</th>
                <th style={{ padding: '14px 18px', width: '220px' }}>Cliente / Empresa</th>
                <th style={{ padding: '14px 18px', width: '130px' }}>Avaliação</th>
                <th style={{ padding: '14px 18px' }}>Depoimento</th>
                <th style={{ padding: '14px 18px', width: '90px' }}>Ordem</th>
                <th style={{ padding: '14px 18px', width: '120px' }}>Status</th>
                <th style={{ padding: '14px 18px', width: '120px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 18px', textAlign: 'center', color: '#94A3B8' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, color: '#64748B' }}>Nenhuma avaliação cadastrada.</p>
                    <p style={{ fontSize: '13px' }}>Clique no botão &quot;Adicionar Avaliação&quot; acima para começar.</p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr
                    key={rev.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 150ms',
                    }}
                  >
                    {/* Avatar */}
                    <td style={{ padding: '14px 18px' }}>
                      {rev.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rev.avatarUrl}
                          alt={rev.customerName}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid #E2E8F0',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {rev.customerName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>

                    {/* Cliente / Empresa */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{rev.customerName}</span>
                        {rev.isVerified && (
                          <span title="Cliente Verificado" style={{ display: 'inline-flex' }}>
                            <ShieldCheck size={14} color="#00C853" />
                          </span>
                        )}
                      </div>
                      {rev.companyName && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {rev.companyName}
                        </div>
                      )}
                      {rev.reviewDate && (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {rev.reviewDate}
                        </div>
                      )}
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#00C853' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? 'currentColor' : 'none'}
                            color={s <= rev.rating ? '#00C853' : '#CBD5E1'}
                          />
                        ))}
                        <span style={{ fontSize: '12px', fontWeight: 700, marginLeft: '4px', color: '#334155' }}>
                          {rev.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Depoimento */}
                    <td style={{ padding: '14px 18px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#334155',
                          lineHeight: 1.5,
                          maxWidth: '460px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        &ldquo;{rev.comment}&rdquo;
                      </div>
                    </td>

                    {/* Ordem */}
                    <td style={{ padding: '14px 18px', color: '#475569', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ArrowUpDown size={13} color="#94A3B8" />
                        <span>{rev.order}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      <button
                        onClick={() => handleToggleActive(rev)}
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
                          backgroundColor: rev.isActive ? 'rgba(0, 230, 118, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: rev.isActive ? '#00A854' : '#DC2626',
                        }}
                        title="Clique para alternar visibilidade pública"
                      >
                        {rev.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{rev.isActive ? 'Ativo' : 'Inativo'}</span>
                      </button>
                    </td>

                    {/* Ações */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(rev)}
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
                          title="Editar avaliação"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(rev.id, rev.customerName)}
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
                          title="Excluir avaliação"
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

      {/* MODAL ADICIONAR / EDITAR AVALIAÇÃO */}
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                <Star size={20} color="var(--brand-primary)" />
                <span>{editingReview ? 'Editar Avaliação' : 'Nova Avaliação de Cliente'}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Nome do Cliente */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Carlos Almeida"
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

                {/* Empresa / Cargo */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Empresa ou Cargo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Diretor de TI — Empresa XYZ"
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

                {/* Foto / Avatar */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Foto de Perfil (Opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      <Upload size={14} />
                      <span>{uploadingAvatar ? 'Enviando...' : 'Fazer Upload de Foto'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>ou insira a URL da imagem:</span>
                  </div>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Ex: /uploads/avaliacoes/foto.jpg ou URL externa"
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

                {/* Rating (1 a 5 estrelas) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Classificação / Nota *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Star
                          size={24}
                          fill={starNum <= rating ? '#00C853' : 'none'}
                          color={starNum <= rating ? '#00C853' : '#CBD5E1'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginLeft: '8px' }}>
                      {rating} estrelas
                    </span>
                  </div>
                </div>

                {/* Comentário */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Depoimento / Comentário *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Descreva a experiência do cliente com o atendimento, equipamentos ou projetos da TECH7..."
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

                {/* Data e Ordem */}
                <div className="grid-2-mobile" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      Data de Referência
                    </label>
                    <input
                      type="text"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      placeholder="Ex: Há 1 mês, Há 3 semanas"
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
                </div>

                {/* Checkboxes: Verificado e Ativo */}
                <div style={{ display: 'flex', gap: '24px', paddingTop: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span>Cliente Verificado</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive ? '#00A854' : '#64748B',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span>{isActive ? 'Ativo no site' : 'Inativo (Oculto)'}</span>
                  </label>
                </div>
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
                  disabled={loading || uploadingAvatar}
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
                  <span>{loading ? 'Salvando...' : 'Salvar Avaliação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
