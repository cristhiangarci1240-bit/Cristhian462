import '@/styles/globals.css';
import { Metadata } from 'next';
import { getSettings } from '@/lib/db';
import { BrandProvider } from '@/components/BrandProvider';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: `${settings.heroTitle} | TECH7 ELECTRONICS B2B`,
      template: '%s | TECH7 ELECTRONICS',
    },
    description: settings.heroSubtitle,
    icons: {
      icon: settings.faviconUrl || '/favicon.svg',
    },
    keywords: [
      'tecnologia corporativa',
      'eletrônicos B2B',
      'sala de conferências',
      'workstations',
      'smartphones corporativos',
      'brindes tecnológicos',
      'TECH7',
    ],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href={settings.faviconUrl || '/favicon.svg'} />
      </head>
      <body>
        <BrandProvider initialSettings={settings}>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}
