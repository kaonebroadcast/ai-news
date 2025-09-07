"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /news after a short delay to show the loading animation
    const timer = setTimeout(() => {
      router.push('/news');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Pradesh AI News Report</h1>
        <p className="text-red-600 animate-pulse">Loading the latest news...</p>
      </div>
    </div>
  );
}
