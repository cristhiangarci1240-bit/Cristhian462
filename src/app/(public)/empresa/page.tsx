import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Zap, Target, Cpu, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre a Empresa | TECH7 Electronics B2B',
  description: 'Conheça a TECH7 Electronics, especialista em tecnologia, infraestrutura audiovisual e equipamentos corporativos para empresas.',
};

export default function EmpresaPage() {
  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '740px', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <span className="tech-badge">
              <span className="tech-badge-dot" />
              IDENTIDADE CORPORATIVA
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>
            A Força Tecnológica por Trás dos Seus Resultados
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.6 }}>
            A TECH7 Electronics nasceu com a missão de eliminar as barreiras de complexidade na aquisição e implantação de tecnologia para empresas no Brasil.
          </p>
        </div>

        {/* Bloco Institucional */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '40px',
            marginBottom: '72px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px',
            }}
          >
            <div style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
              <Target size={30} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Nossa Missão</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14.5px' }}>
              Prover equipamentos eletrônicos de alto padrão técnico e soluções audiovisuais completas com transparência, agilidade de entrega e atendimento consultivo especializado para o mercado corporativo.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px',
            }}
          >
            <div style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
              <Cpu size={30} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Inovação & Rigor Técnico</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14.5px' }}>
              Trabalhamos exclusivamente com marcas consagradas e modelos de linha profissional empresarial, garantindo estabilidade e compatibilidade de longo prazo para as operações dos nossos clientes.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--brand-surface-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px',
            }}
          >
            <div style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>
              <Shield size={30} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Solidez & Confiabilidade</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14.5px' }}>
              Com estrutura logística eficiente e corpo técnico experiente, oferecemos segurança jurídica, faturamento corporativo estruturado e garantia real com suporte pós-venda atuante.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            backgroundColor: 'var(--brand-surface)',
            border: '1px solid var(--brand-border-tech)',
            borderRadius: 'var(--radius-md)',
            padding: 'clamp(20px, 6vw, 48px)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            Pronto para equipar sua organização?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 24px', fontSize: '15px' }}>
            Fale diretamente com nossa equipe de consultores corporativos e receba uma proposta técnica sob medida para as necessidades da sua empresa.
          </p>
          <Link href="/contato" className="btn btn-primary btn-lg">
            Fale com um consultor corporativo
          </Link>
        </div>
      </div>
    </div>
  );
}
