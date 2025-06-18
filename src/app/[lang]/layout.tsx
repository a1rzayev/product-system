import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Providers from "@/components/Providers";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import AuthRedirect from "@/components/AuthRedirect";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Language } from "@/lib/i18n";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product System",
  description: "A comprehensive e-commerce product management system",
};

export default function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Language };
}>) {
  const { lang } = params;
  const htmlLang = lang.split('-')[0]; // Extract language code (en, az, ru)

  return (
    <html lang={htmlLang}>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthRedirect />
          <div className="flex justify-end p-4">
            <LanguageSwitcher />
          </div>
          <ConditionalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
} 