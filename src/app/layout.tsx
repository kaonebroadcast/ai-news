'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthButtons from "@/components/AuthButtons";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


function Header() {
  const { isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/verify-otp';

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isAuthPage || !isAuthenticated) {
    return null;
  }
  
  return (
    <header className="bg-red-600 text-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-white">Pradesh24 AI</span>
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                AI-Powered News Platform
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            <Link 
              href="/news" 
              className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              History
            </Link>
            <Link 
              href="/news/new" 
              className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              New Report
            </Link>
            <AuthButtons />
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow bg-white">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="bg-white border border-red-100 rounded-lg shadow-sm">
                {children}
              </div>
            </div>
          </main>

          <footer className="bg-red-600 text-white mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-white text-sm">
                © {new Date().getFullYear()} Pradesh24 AI. All rights reserved.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
