'use client';

import React, { useState } from 'react';
import { MessageSquare, Save, CheckCircle2, Phone, Clock, FileText } from 'lucide-react';
import { SiteSettings, WhatsAppInquiry } from '@/lib/types';
import { useBrand } from '@/components/BrandProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';

interface WhatsAppAdminClientProps {
  initialSettings: SiteSettings;
  inquiries: WhatsAppInquiry[];
}

export function WhatsAppAdminClient({ initialSettings, inquiries }: WhatsAppAdminClientProps) {
  const { updateLocalSettings } = useBrand();

  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(initialSettings.whatsappDefaultMessage);
  const [whatsappProductMessage, setWhatsappProductMessage] = useState(initialSettings.whatsappProductMessage);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Previsão em tempo real da mensagem com produto exemplo
  const exampleProduct = 'Workstation Pro Desk Ultra 16-Core';
  const previewLink = buildWhatsAppLink(whatsappNumber, whatsappProductMessage, exampleProduct);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber,
          whatsappDefaultMessage,
          whatsappProductMessage,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateLocalSettings(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Erro ao salvar configurações do WhatsApp.');
      }
    } catch (_) {
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Configuração do WhatsApp Comercial</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          O WhatsApp é o principal canal de fechamento e cotação corporativa da TECH7.
        </p>
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
          <span>Configurações do WhatsApp atualizadas com sucesso!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Formulário de Configuração */}
        <form
          onSubmit={handleSave}
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '28px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Parâmetros Comerciais</h3>

          <div className="form-group">
            <label className="form-label">Número do WhatsApp Comercial (DDI + DDD + Telefone)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ex: 5511999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Utilize apenas números com DDI do Brasil (55) e DDD. Exemplo: 5511999998888.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Mensagem Padrão (Menu, Rodapé e Botão Flutuante)</label>
            <textarea
              rows={3}
              required
              className="form-textarea"
              value={whatsappDefaultMessage}
              onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Modelo de Mensagem para Produtos</label>
            <textarea
              rows={3}
              required
              className="form-textarea"
              value={whatsappProductMessage}
              onChange={(e) => setWhatsappProductMessage(e.target.value)}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--brand-primary)', marginTop: '4px', display: 'block' }}>
              A tag <strong>[NOME DO PRODUTO]</strong> será substituída automaticamente pelo nome exato do item visualizado.
            </span>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            <Save size={16} />
            <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </form>

        {/* Simulador de Previsão de Conversa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: '#091510',
              border: '1px solid #143825',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366', marginBottom: '16px' }}>
              <MessageSquare size={18} />
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Simulação do Atendimento ao Cliente</h4>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Quando o cliente clicar no botão do produto <em>&quot;{exampleProduct}&quot;</em>, o WhatsApp abrirá com o seguinte texto pronto:
            </p>

            <div
              style={{
                backgroundColor: '#072417',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: '4px solid #25D366',
                color: '#E2FCEE',
                fontSize: '13.5px',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              &quot;{whatsappProductMessage.replace(/\[NOME DO PRODUTO\]/g, exampleProduct)}&quot;
            </div>

            <a
              href={previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm"
              style={{ width: '100%' }}
            >
              Testar Abertura no WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Histórico Completo de Interações do WhatsApp */}
      <div
        style={{
          backgroundColor: 'var(--brand-surface-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          Registro de Cliques e Consultas ({inquiries.length})
        </h3>

        {inquiries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--brand-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Data e Hora</th>
                  <th style={{ padding: '12px 16px' }}>Origem / Produto Consultado</th>
                  <th style={{ padding: '12px 16px' }}>Endereço IP</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr key={inq.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '6px' }} />
                      {new Date(inq.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-white)' }}>
                      {inq.productName || 'Consulta Geral pelo Header/Botão Flutuante'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {inq.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(0, 230, 118, 0.1)',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          color: '#00E676',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        Encaminhado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Nenhuma consulta registrada até o momento.
          </p>
        )}
      </div>
    </div>
  );
}
