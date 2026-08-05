import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Navigation } from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Student Money Tracker",
  description: "Personal expenses & peer-to-peer shared debt tracker with Warm Off-White Minimalist design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#FAF9F6] dark:bg-[#121212] text-[#1A1A1A] dark:text-[#F4F4F5] min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider>
          {/* Mobile Top Header (< 768px) */}
          <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xs border-b border-[#EAE8E3] dark:border-[#2D2D2D] px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-lg font-bold text-[#1A1A1A] dark:text-[#F4F4F5] tracking-tight">
                Student Money Tracker
              </h1>
              <ThemeToggle />
            </div>
          </header>

          {/* Main App Layout (with Desktop Left Sidebar Spacing) */}
          <div className="flex-1 md:pl-64 flex flex-col">
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-24 md:pb-12">
              {children}
            </main>
          </div>

          {/* Responsive Navigation Component (Mobile Bottom Bar + Desktop Left Sidebar) */}
          <Navigation />
        </ThemeProvider>

        {/* Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
