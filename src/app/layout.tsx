import type { Metadata } from "next";
import "./globals.css";
import SupportBot from "@/components/SupportBot";

export const metadata: Metadata = {
  title: "VagasIA — Transforme vagas vazias em faturação.",
  description:
    "Automação de agendamentos com IA para negócios por marcação em Portugal.",
  manifest: "/manifest.json",
  themeColor: "#4ECDC4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VagasIA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full">
        {children}
        <SupportBot />
      </body>
    </html>
  );
}
