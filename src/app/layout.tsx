import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import '@/styles/globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgiFind — Dog Agility Trial Finder',
  description:
    'Find AKC, USDAA, CPE, NADAC, UKI, and CKC dog agility trials in one place. Search by location, date, organization, and level.',
  keywords: ['dog agility', 'agility trials', 'AKC', 'USDAA', 'CPE', 'NADAC', 'UKI', 'CKC'],
  openGraph: {
    title: 'AgiFind — Dog Agility Trial Finder',
    description: 'Every agility trial. One search.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
