import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARGON Solutions — Prosjektstyring",
  description: "Prosjektstyring for olje- og gassindustrien",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className={`${inter.className} bg-surface text-text antialiased`}>
        <Sidebar />
        <main className="ml-0 min-h-screen p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
