import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VagasIA — Transforme vagas vazias em faturação.",
  description:
    "Automação de agendamentos com IA para negócios por marcação em Portugal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
