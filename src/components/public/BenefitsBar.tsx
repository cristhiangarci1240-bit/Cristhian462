import React from 'react';
import { Settings2, Users, PackageCheck, HeadphonesIcon } from 'lucide-react';
import styles from './BenefitsBar.module.css';

export function BenefitsBar() {
  const benefits = [
    {
      icon: <Settings2 size={22} strokeWidth={2} />,
      title: 'Soluções personalizadas',
      desc: 'Projetos sob medida para cada empresa',
    },
    {
      icon: <Users size={22} strokeWidth={2} />,
      title: 'Atendimento especializado',
      desc: 'Equipe B2B dedicada ao seu negócio',
    },
    {
      icon: <PackageCheck size={22} strokeWidth={2} />,
      title: 'Entrega com qualidade',
      desc: 'Produtos originais e homologados',
    },
    {
      icon: <HeadphonesIcon size={22} strokeWidth={2} />,
      title: 'Suporte e acompanhamento',
      desc: 'Pós-venda e assistência contínua',
    },
  ];

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.grid}`}>
        {benefits.map((item, idx) => (
          <div key={idx} className={styles.item}>
            <div className={styles.iconWrapper}>{item.icon}</div>
            <div>
              <div className={styles.title}>{item.title}</div>
              <div className={styles.desc}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
