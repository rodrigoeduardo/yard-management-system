import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { TopLoader } from "@/components/ui/top-loader";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { PWA_THEME_COLOR } from "@/lib/pwa/colors";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Estoque de Pátio",
  description: "Sistema de controle de estoque de pátio por Nota Fiscal e QR Code",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pátio",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSans.variable} ${splineSansMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TopLoader />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
