"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AuthButtons() {
  const { isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-24 flex justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <button
        onClick={() => logout()}
        className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    >
      Login
    </Link>
  );
}
