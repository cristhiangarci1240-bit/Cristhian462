import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Video, Laptop, Smartphone, Gift, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Soluções Corporativas em Tecnologia & ÁudioVisual',
  description: 'Desenvolvemos soluções personalizadas para salas de videoconferência, frotas corporativas de dispositivos e infraestrutura de TI.',
};

export default function SolucoesPage() {
  const solutions = [
    {
      icon: <Video size={36} color="var(--brand-primary)" />,
      title: 'Salas de Conferência Inteligentes',
      subtitle: 'Colaboração híbrida sem atrito com integração nativa às principais plataformas.',
      desc: 'Projetamos ambientes corporativos completos equipados com câmeras 4K com autoframing por IA, cancelamento acústico de eco e microfones omnidirecionais para salas de diretoria e auditórios.',
      benefits: [
        'Compatibilidade nativa com Microsoft Teams Rooms e Zoom Rooms',
        'Acionamento de reuniões com 1 único toque no painel',
        'Captação de áudio sem pontos cegos em mesas executivas',
      ],
      linkText: 'Ver equipamentos de videoconferência',
      linkHref: '/produtos?categoria=sala-de-conferencias',
    },
    {
      icon: <Laptop size={36} color="var(--brand-primary)" />,
      title: 'Padronização de Parque de Computadores',
      subtitle: 'Workstations e notebooks corporativos para operações críticas de alta demanda.',
      desc: 'Elimine a disparidade de hardware na sua organização. Fornecemos lotes homologados de estações de trabalho e ultrabooks com garantia on-site e suporte a imagens corporativas customizadas.',
      benefits: [
        'Homologação de segurança com chip TPM 2.0 e vPro',
        'Garantia corporativa estendida de até 36 meses',
        'Configuração sob demanda para engenharia, finanças e design',
      ],
      linkText: 'Explorar computadores e workstations',
      linkHref: '/produtos?categoria=computadores',
    },
    {
      icon: <Smartphone size={36} color="var(--brand-primary)" />,
      title: 'Mobilidade Corporativa & Frotas Seguras',
      subtitle: 'Dispositivos móveis corporativos com suporte integral a MDM e criptografia.',
      desc: 'Equipe equipes de vendas, logística e liderança com smartphones de padrão militar e bateria duradoura, prontos para gestão remota e contenção de vazamento de dados.',
      benefits: [
        'Integração imediata com plataformas corporativas de MDM / EMM',
        'Certificação de resistência contra quedas e água IP68',
        'Substituição expressa de aparelhos em caso de sinistro',
      ],
      linkText: 'Conhecer smartphones corporativos',
      linkHref: '/produtos?categoria=celulares',
    },
    {
      icon: <Gift size={36} color="var(--brand-primary)" />,
      title: 'Brindes Tecnológicos & Kits Executivos',
      subtitle: 'Eletrônicos premium personalizados a laser para eventos e presentes corporativos.',
      desc: 'Fortaleça laços com clientes estratégicos e celebre conquistas internas com eletrônicos de alto valor percebido: carregadores por indução, fones anti-ruído e powerbanks de alta potência.',
      benefits: [
        'Gravação a laser de altíssima definição da sua logomarca',
        'Estojos rígidos executivos de apresentação',
        'Lotes corporativos a partir de 25 unidades',
      ],
      linkText: 'Ver catálogo de brindes corporativos',
      linkHref: '/produtos?categoria=brindes-corporativos',
    },
  ];

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '720px', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <span className="tech-badge">
              <span className="tech-badge-dot" />
              ENGENHARIA E PROJETOS B2B
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.15, marginBottom: '16px' }}>
            Soluções Tecnológicas Integradas para Empresas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.6 }}>
            Mais do que fornecer hardware, a TECH7 entrega ecossistemas tecnológicos completos para elevar a produtividade, a segurança e a comunicação da sua equipe.
          </p>
        </div>

        {/* Grade de Soluções */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(480px, 100%), 1fr))', gap: '32px' }}>
          {solutions.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--brand-surface-card)',
                border: '1px solid var(--brand-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'clamp(20px, 5vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div>{item.icon}</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{item.title}</h2>
              <p style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '14px' }}>{item.subtitle}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.6 }}>{item.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0 16px' }}>
                {item.benefits.map((b, bIdx) => (
                  <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                    <CheckCircle2 size={16} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }}>{b}</span>
                  </div>
                ))}
              </div>

              <Link
                href={item.linkHref}
                className="btn btn-secondary"
                style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
              >
                <span>{item.linkText}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
