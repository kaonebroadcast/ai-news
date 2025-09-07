"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: { id: string; email: string; name: string; token: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // Verify token is not expired
          if (parsedUser.token === token) {
            setUser(parsedUser);
            return;
          }
        }
        // If no valid token or user data, clear auth
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: { id: string; email: string; name: string; token: string }) => {
    // Store token in localStorage
    localStorage.setItem('authToken', userData.token);
    
    // Store user data in localStorage
    const userInfo = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      token: userData.token
    };
    
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  // Protect routes
  useEffect(() => {
    if (isLoading) return;
    
    const publicPaths = ['/login', '/verify-otp'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    
    if (!user && !isPublicPath) {
      // Store the intended URL before redirecting to login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
    } else if (user && isPublicPath) {
      // Redirect to home if already logged in and trying to access auth pages
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
