import React from 'react';
import Link from 'next/link';
import { Receipt, FileText, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import styles from './Fiscal.module.css';

export const revalidate = 0;

export default function AdminFiscalPage() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>
            <Receipt className={styles.titleIcon} size={28} />
            <span>Fiscal</span>
          </h1>
          <p className={styles.subtitle}>
            Acesse o emissor oficial de Nota Fiscal de Serviço.
          </p>
        </div>
      </div>

      {/* Grid de Cards Fiscais */}
      <div className={styles.cardGrid}>
        <div className={styles.fiscalCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <Receipt size={28} />
            </div>
            <div className={styles.cardTitleArea}>
              <h2 className={styles.cardTitle}>
                <span>🧾 Nota Fiscal de Serviço</span>
                <span className={styles.cardBadge}>NFS-e Nacional</span>
              </h2>
              <p className={styles.cardDescription}>
                Emitir uma nova nota fiscal utilizando o emissor oficial da NFS-e.
              </p>
            </div>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureBullet} />
              <span>Acesso direto ao portal oficial do Governo Federal</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureBullet} />
              <span>Autenticação segura via GOV.BR, Certificado Digital ou Senha</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureBullet} />
              <span>Navegação integrada dentro do painel administrativo TECH7</span>
            </div>
          </div>

          <Link href="/admin/fiscal/emissor" className={styles.btnAction} id="btn-fazer-nota-fiscal">
            <span>Fazer Nota Fiscal</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
