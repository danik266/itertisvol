import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/LangContext';
import { AuthProvider } from '@/lib/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { DataProvider } from '@/lib/DataContext';

export const metadata: Metadata = {
  title: 'IT Ertis Volunteer',
  description: 'Платформа для волонтёров и организаций Павлодара',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <LangProvider>
            <DataProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </DataProvider>
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
