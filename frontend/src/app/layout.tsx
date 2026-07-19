import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kombin Asistanı",
  description: "AI Destekli Stil Asistanınız",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-slate-100 min-h-screen flex items-center justify-center text-slate-900">
        <QueryProvider>
          {/* Mobil-in-Desktop Taşıyıcı Kutu */}
          <main className="w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-[2rem] sm:shadow-2xl sm:border border-slate-200 overflow-hidden bg-white relative flex flex-col">
            <div className="flex-1 overflow-y-auto pb-16">
              {children}
            </div>
            <BottomNav />
            <Toaster position="top-center" />
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
