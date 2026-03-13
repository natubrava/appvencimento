import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NatuBrava - Controle de Vencimentos',
  description: 'Sistema de controle de vencimento de produtos para a loja NatuBrava Produtos Naturais',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  themeColor: '#2563eb',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
