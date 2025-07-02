import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'XBRL Mapping Tool',
  description: 'Automatisches Mapping von Excel-Daten zu XBRL-Taxonomien mit KI-Unterstützung',
  keywords: ['XBRL', 'Excel', 'Mapping', 'Finanzberichterstattung', 'Bundesbank', 'BaFin'],
  authors: [{ name: 'XBRL Tool Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Since this is an internal tool
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div className="min-h-full">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    XBRL Mapping Tool
                  </h1>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Beta
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  KI-gestütztes Excel-zu-XBRL Mapping
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  © 2024 XBRL Mapping Tool. Für interne Nutzung.
                </div>
                <div className="space-x-4">
                  <span>Version 1.0.0</span>
                  <span>•</span>
                  <span>Powered by OpenAI GPT-4</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}