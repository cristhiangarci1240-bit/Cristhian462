import React from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { WhatsAppFloating } from '@/components/public/WhatsAppFloating';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <WhatsAppFloating />
    </div>
  );
}
