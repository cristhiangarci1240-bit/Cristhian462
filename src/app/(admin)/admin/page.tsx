import React from 'react';
import Link from 'next/link';
import { Package, Layers, Users2, MessageSquare, CheckCircle, TrendingUp, ArrowUpRight, Clock } from 'lucide-react';
import { getDashboardStats, getProducts, getCategories } from '@/lib/db';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [stats, products, categories] = await Promise.all([
    getDashboardStats(),
    getProducts(),
    getCategories(),
  ]);

  const cards = [
    {
      label: 'Total de produtos',
      value: stats.totalProducts,
      icon: <Package size={22} color="var(--brand-primary)" />,
      change: `${stats.activeProducts} ativos`,
      href: '/admin/produtos',
    },
    {
      label: 'Produtos ativos',
      value: stats.activeProducts,
      icon: <CheckCircle size={22} color="#00E676" />,
      change: 'Visíveis no catálogo',
      href: '/admin/produtos',
    },
    {
      label: 'Categorias',
      value: stats.totalCategories,
      icon: <Layers size={22} color="#38BDF8" />,
      change: 'Segmentos de mercado',
      href: '/admin/categorias',
    },
    {
      label: 'Clientes',
      value: stats.totalClients,
      icon: <Users2 size={22} color="#F59E0B" />,
      change: 'Empresas parceiras',
      href: '/admin/clientes',
    },
    {
      label: 'Consultas',
      value: stats.totalInquiries,
      icon: <TrendingUp size={22} color="#A78BFA" />,
      change: 'Interações registradas',
      href: '/admin/whatsapp',
    },
    {
      label: 'Consultas pelo WhatsApp',
      value: stats.totalInquiries,
      icon: <MessageSquare size={22} color="#25D366" />,
      change: 'Conversão direta comercial',
      href: '/admin/whatsapp',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Dashboard Corporativo</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Visão geral em tempo real de produtos, categorias, parceiros e métricas comerciais.
          </p>
        </div>

        <Link href="/admin/produtos/novo" className="btn btn-primary btn-sm">
          <span>+ Adicionar produto</span>
        </Link>
      </div>

      {/* Grid de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {cards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {card.label}
              </span>
              <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--brand-surface)' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {card.change}
            </div>
          </Link>
        ))}
      </div>

      {/* Seção Gráfica e Analítica Útil */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', marginBottom: '36px' }}>
        {/* Distribuição por Categoria */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            Distribuição de Produtos por Categoria
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const percent = products.length > 0 ? Math.round((count / products.length) * 100) : 0;

              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} produtos ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--brand-surface)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        backgroundColor: 'var(--brand-primary)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              Ações Rápidas de Gestão
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Gerencie a vitrine corporativa e o canal WhatsApp de maneira centralizada.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/admin/produtos/novo" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Package size={15} /> Cadastrar novo produto
            </Link>
            <Link href="/admin/aparencia" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Layers size={15} /> Personalizar logo e cores
            </Link>
            <Link href="/admin/whatsapp" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <MessageSquare size={15} /> Configurar número e mensagens de WhatsApp
            </Link>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Consultas */}
      <div
        style={{
          backgroundColor: 'var(--brand-surface-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Consultas Recentes pelo WhatsApp
          </h3>
          <Link href="/admin/whatsapp" style={{ fontSize: '13px', color: 'var(--brand-primary)' }}>
            Ver todas as consultas <ArrowUpRight size={13} style={{ display: 'inline' }} />
          </Link>
        </div>

        {stats.recentInquiries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--brand-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Data / Hora</th>
                  <th style={{ padding: '12px 16px' }}>Produto Consultado</th>
                  <th style={{ padding: '12px 16px' }}>Endereço IP</th>
                  <th style={{ padding: '12px 16px' }}>Canal</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInquiries.map((inq) => (
                  <tr key={inq.id} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <Clock size={13} style={{ display: 'inline', marginRight: '6px' }} />
                      {new Date(inq.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>
                      {inq.productName || 'Consulta Geral via Cabeçalho/Hero'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {inq.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(37, 211, 102, 0.1)',
                          border: '1px solid rgba(37, 211, 102, 0.3)',
                          color: '#25D366',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        WhatsApp Oficial
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>
            Nenhuma consulta registrada até o momento.
          </p>
        )}
      </div>
    </div>
  );
}
