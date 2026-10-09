'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare, Clock, CheckCircle2, Send } from 'lucide-react';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export default function ContatoPage() {
  const { settings } = useBrand();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    categoria: 'Geral',
    mensagem: '',
  });

  const handleWhatsApp = async () => {
    try {
      fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'contato_page' }),
      });
    } catch (_) {}

    const url = buildWhatsAppLink(
      settings.whatsappNumber,
      settings.whatsappDefaultMessage
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '640px', marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <span className="tech-badge">
              <span className="tech-badge-dot" />
              CANAL CORPORATIVO B2B
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>
            Fale com a TECH7 Electronics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            Entre em contato através do nosso WhatsApp oficial para resposta imediata ou preencha o formulário para atendimento por e-mail e proposta formal.
          </p>
        </div>

        <div className="grid-split-mobile" style={{ gap: '48px' }}>
          {/* Formulário Corporativo */}
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px',
            }}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
              Solicitar Proposta Comercial
            </h3>

            {submitted ? (
              <div
                style={{
                  padding: '32px',
                  backgroundColor: 'rgba(0, 230, 118, 0.08)',
                  border: '1px solid var(--brand-border-tech)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--brand-primary)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <CheckCircle2 size={48} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Mensagem Recebida com Sucesso!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Nossa equipe de consultores corporativos analisará suas informações e entrará em contato em até 4 horas úteis.
                </p>
                <button
                  onClick={handleWhatsApp}
                  className="btn btn-whatsapp"
                  style={{ margin: '0 auto' }}
                >
                  <MessageSquare size={16} />
                  <span>Acelerar pelo WhatsApp</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid-2-mobile" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      className="form-input"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa / Razão Social</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Nexus Corp Ltda"
                      className="form-input"
                      value={form.empresa}
                      onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2-mobile" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@empresa.com.br"
                      className="form-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      className="form-input"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Área de Interesse Principal</label>
                  <select
                    className="form-select"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    <option value="Geral">Cotação Geral de Equipamentos</option>
                    <option value="Sala de conferências">Sala de Conferências & ÁudioVisual</option>
                    <option value="Computadores">Computadores & Workstations</option>
                    <option value="Celulares">Smartphones & Frotas Corporativas</option>
                    <option value="Brindes corporativos">Brindes Corporativos Tecnológicos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Detalhes da Necessidade / Quantidades</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Descreva quantidade estimada de equipamentos, prazos desejados ou especificações necessárias..."
                    className="form-textarea"
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <Send size={18} />
                  <span>Enviar Solicitação de Cotação</span>
                </button>
              </form>
            )}
          </div>

          {/* Cartões de Contato e WhatsApp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Cartão de Destaque WhatsApp */}
            <div
              style={{
                backgroundColor: 'var(--brand-surface)',
                border: '1px solid var(--brand-border-tech)',
                borderRadius: 'var(--radius-md)',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'inline-flex' }}>
                <span className="tech-badge">RESPOSTA IMEDIATA</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700 }}>Canal WhatsApp Oficial</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                Converse diretamente com nossos especialistas para tirar dúvidas técnicas sobre equipamentos e obter cotações com agilidade.
              </p>
              <button
                onClick={handleWhatsApp}
                className="btn btn-whatsapp btn-lg"
                style={{ width: '100%' }}
                id="contato-whatsapp-cta"
              >
                <MessageSquare size={20} />
                <span>Conversar pelo WhatsApp</span>
              </button>
            </div>

            {/* Dados Institucionais */}
            <div
              style={{
                backgroundColor: 'var(--brand-surface-card)',
                border: '1px solid var(--brand-border)',
                borderRadius: 'var(--radius-md)',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', marginTop: '2px' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Telefone Corporativo</h4>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-white)' }}>{settings.contactPhone}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', marginTop: '2px' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>E-mail para Cotações</h4>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-white)' }}>{settings.contactEmail}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', marginTop: '2px' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Sede Corporativa</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{settings.address}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand-primary)', marginTop: '2px' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Horário de Atendimento</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Segunda a Sexta, das 08h30 às 18h00 (Horário de Brasília)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
