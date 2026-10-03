'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import styles from '../Fiscal.module.css';

export default function FiscalEmissorPage() {
  const portalUrl = 'https://www.nfse.gov.br/EmissorNacional/';
  const [showFallbackNotice, setShowFallbackNotice] = useState(true);

  return (
    <div className={styles.emissorContainer}>
      {/* Barra Superior de Ações */}
      <div className={styles.emissorTopBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/admin/fiscal" className={styles.btnBack} id="btn-voltar-fiscal">
            <ArrowLeft size={16} />
            <span>Voltar para Fiscal</span>
          </Link>
          <div className={styles.titleArea}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Emissor de Nota Fiscal
            </h1>
          </div>
        </div>

        <div className={styles.emissorInfoBadge}>
          <ShieldCheck size={16} color="#008744" />
          <span>Ambiente Oficial da NFS-e Nacional</span>
        </div>
      </div>

      {/* Mensagem Profissional de Contingência / Fallback */}
      {showFallbackNotice && (
        <div className={styles.emissorNotice}>
          <p className={styles.noticeText}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#D97706' }} />
            <span>
              Não foi possível incorporar o emissor oficial nesta janela porque o portal oficial não permite carregamento incorporado.
            </span>
          </p>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnFallback}
            id="btn-abrir-emissor-oficial"
            title="Acessar o portal oficial da NFS-e Nacional diretamente"
          >
            <span>Abrir Emissor Oficial</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Quadro de Incorporação (Tentativa de Iframe) */}
      <div className={styles.iframeWrapper}>
        <iframe
          src={portalUrl}
          title="Emissor Nacional de NFS-e"
          className={styles.iframeElement}
          allow="camera; microphone; geolocation"
        />
      </div>
    </div>
  );
}
