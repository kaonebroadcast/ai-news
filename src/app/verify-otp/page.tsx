"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function VerifyOtpContent() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const otpInputs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const email = searchParams.get('email') || '';

  // Handle countdown for resend OTP
  useEffect(() => {
    // If email is not provided, redirect to login
    if (!email) {
      router.push('/login');
      return;
    }
    
    let timer: NodeJS.Timeout;
    
    if (countdown > 0 && resendDisabled) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, resendDisabled, email, router]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers and empty string
    if (value && !/^\d*$/.test(value)) return;
    
    // Limit to single digit
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = otpInputs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      const prevInput = otpInputs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const validateOtp = (): boolean => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
      setError('OTP must contain only numbers');
      return false;
    }
    
    return true;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateOtp()) {
      return;
    }
    
    const otpCode = otp.join('');

    setLoading(true);
    setError('');

    try {
      // Get the temporary auth token from session storage
      const tempToken = sessionStorage.getItem('tempAuthToken');
      
      if (!tempToken) {
        throw new Error('Session expired. Please login again.');
      }

      
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ email, otp: otpCode }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }

      // Clear the temporary token
      sessionStorage.removeItem('tempAuthToken');
      
      // Update auth context with the verified user data
      login({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        token: data.token || tempToken
      });

      // Redirect to home page on successful verification
      router.push('/');
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      
      // Clear the OTP fields on error
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    
    setResendDisabled(true);
    setCountdown(30);
    setError('');
    setLoading(true);
    
    try {
      const tempToken = sessionStorage.getItem('tempAuthToken');
      if (!tempToken) {
        throw new Error('Session expired. Please login again.');
      }
      
      const response = await fetch(`${apiUrl}/api/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      // Show success message
      setError('OTP has been resent to your email');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
      setResendDisabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        {error && (
          <div 
            className={`p-4 rounded-md ${
              error.includes('resent') 
                ? 'bg-green-50 border-l-4 border-green-500 text-green-700' 
                : 'bg-red-50 border-l-4 border-red-500 text-red-700'
            }`}
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div className="flex justify-between max-w-xs mx-auto space-x-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-14">
                <input
                  ref={el => { if (el) otpInputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-full h-full text-center text-2xl font-semibold rounded-md border ${
                    error && error.includes('OTP') ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  disabled={loading}
                  autoFocus={i === 0}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendDisabled || loading}
              className={`font-medium ${
                resendDisabled || loading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-500'
              }`}
            >
              {resendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
