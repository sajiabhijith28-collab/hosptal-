import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { MobileNav } from '@/components/MobileNav';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ente Hospital — Doctor Appointment Booking',
  description: 'Book verified medical specialists across Ente Hospital in under a minute.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors selection:bg-[#EFF6FF] selection:text-[#2563EB]">
        <Providers>
          <div className="flex-1 flex flex-col pb-20 sm:pb-0">
            {children}
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
