import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scheduling Platform | SlotSync",
  description: "A beautiful scheduling application powered by SlotSync",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-brand-100 selection:text-brand-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
