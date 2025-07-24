import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContextFirebase';
import { WeekNavigationProvider } from '@/contexts/WeekNavigationContext';

export const metadata: Metadata = {
  title: "شركة سلامة السعودية - نظام إدارة الصيانة",
  description: "نظام إدارة جدولة الصيانة - شركة سلامة السعودية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <AuthProvider>
          <WeekNavigationProvider>
            {children}
          </WeekNavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
