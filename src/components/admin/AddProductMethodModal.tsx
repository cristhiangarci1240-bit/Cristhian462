'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ScanBarcode,
  PenLine,
  Camera,
  FileSpreadsheet,
  ChevronRight,
  Clock,
} from 'lucide-react';
import styles from './AddProductMethodModal.module.css';

export interface AddProductMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: () => void;
  onSelectBarcode?: () => void;
  onSelectPhoto?: () => void;
  onSelectSpreadsheet?: () => void;
}

interface MethodOption {
  id: 'ai' | 'barcode' | 'manual' | 'photo' | 'spreadsheet';
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  badge?: {
    text: string;
    type: 'ai' | 'comingSoon';
  };
  isAvailable: boolean;
}

export function AddProductMethodModal({
  isOpen,
  onClose,
  onSelectManual,
  onSelectAI,
  onSelectBarcode,
  onSelectPhoto,
  onSelectSpreadsheet,
}: AddProductMethodModalProps) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNotice(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showTemporaryNotice = (msg: string) => {
    setNotice(msg);
  };

  const handleSelect = (id: 'ai' | 'barcode' | 'manual' | 'photo' | 'spreadsheet') => {
    switch (id) {
      case 'manual':
        setNotice(null);
        onSelectManual();
        break;

      case 'ai':
        setNotice(null);
        onSelectAI();
        break;

      case 'barcode':
        if (onSelectBarcode) {
          onSelectBarcode();
        } else {
          showTemporaryNotice('Esta funcionalidade será disponibilizada em breve.');
        }
        break;

      case 'photo':
        if (onSelectPhoto) {
          onSelectPhoto();
        } else {
          showTemporaryNotice('Esta funcionalidade será disponibilizada em breve.');
        }
        break;

      case 'spreadsheet':
        if (onSelectSpreadsheet) {
          onSelectSpreadsheet();
        } else {
          showTemporaryNotice('Esta funcionalidade será disponibilizada em breve.');
        }
        break;
    }
  };

  const options: MethodOption[] = [
    {
      id: 'ai',
      title: 'Criar com IA',
      description: 'Encontre informações do produto pelo nome ou link.',
      icon: <Sparkles size={22} />,
      iconBg: '#EFF6FF',
      iconBorder: '#BFDBFE',
      iconColor: '#2563EB',
      badge: {
        text: 'IA Integrada',
        type: 'ai',
      },
      isAvailable: true,
    },
    {
      id: 'barcode',
      title: 'Escanear um código de barras',
      description: 'Leia um código EAN/GTIN usando a câmera.',
      icon: <ScanBarcode size={22} />,
      iconBg: '#F0FDF4',
      iconBorder: '#BBF7D0',
      iconColor: '#16A34A',
      badge: {
        text: 'Em breve',
        type: 'comingSoon',
      },
      isAvailable: false,
    },
    {
      id: 'manual',
      title: 'Criar manualmente',
      description: 'Preencha os dados do produto manualmente.',
      icon: <PenLine size={22} />,
      iconBg: '#F8FAFC',
      iconBorder: '#E2E8F0',
      iconColor: '#0F172A',
      isAvailable: true,
    },
    {
      id: 'photo',
      title: 'Criar a partir de uma foto',
      description: 'Envie uma foto para identificar o produto.',
      icon: <Camera size={22} />,
      iconBg: '#FFFBEB',
      iconBorder: '#FDE68A',
      iconColor: '#D97706',
      badge: {
        text: 'Em breve',
        type: 'comingSoon',
      },
      isAvailable: false,
    },
    {
      id: 'spreadsheet',
      title: 'Importar uma planilha',
      description: 'Cadastre vários produtos de uma só vez.',
      icon: <FileSpreadsheet size={22} />,
      iconBg: '#F5F3FF',
      iconBorder: '#DDD6FE',
      iconColor: '#7C3AED',
      badge: {
        text: 'Em breve',
        type: 'comingSoon',
      },
      isAvailable: false,
    },
  ];

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-method-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="add-product-method-title" className={styles.title}>
              Como você gostaria de adicionar o produto?
            </h2>
            <p className={styles.subtitle}>
              Escolha o método que preferir para cadastrar seu produto.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
            id="btn-close-method-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Temporary notice when selecting coming soon features */}
          {notice && (
            <div className={styles.noticeBanner} role="status" aria-live="polite">
              <div className={styles.noticeIconWrap}>
                <Clock size={16} />
              </div>
              <span className={styles.noticeText}>{notice}</span>
              <button
                type="button"
                className={styles.noticeCloseBtn}
                onClick={() => setNotice(null)}
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Options list */}
          <div className={styles.optionsList}>
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                id={`btn-method-${opt.id}`}
                className={styles.optionCard}
                onClick={() => handleSelect(opt.id)}
              >
                <div className={styles.cardLeft}>
                  <div
                    className={styles.iconContainer}
                    style={{
                      backgroundColor: opt.iconBg,
                      border: `1px solid ${opt.iconBorder}`,
                      color: opt.iconColor,
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.optionTitle}>{opt.title}</div>
                    <div className={styles.optionDesc}>{opt.description}</div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  {opt.badge && (
                    <span
                      className={`${styles.badge} ${
                        opt.badge.type === 'ai' ? styles.badgeAi : styles.badgeComingSoon
                      }`}
                    >
                      {opt.badge.text}
                    </span>
                  )}
                  <div className={styles.arrowIcon}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerHint}>
            TECH7 Electronics &bull; Gestão de Catálogo Corporativo
          </p>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            id="btn-cancel-method-modal"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
