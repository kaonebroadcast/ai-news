// Re-export the OTP store type
export type OtpData = {
  otp: string;
  expiresAt: number;
};

// In-memory storage for OTPs
export const otpStore: Record<string, OtpData> = {};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyOTP(phoneNumber: string, userOtp: string): boolean {
  const otpData = otpStore[phoneNumber];
  
  if (!otpData) {
    return false; // No OTP found for this number
  }

  // Check if OTP is expired
  if (Date.now() > otpData.expiresAt) {
    delete otpStore[phoneNumber]; // Clean up expired OTP
    return false;
  }

  // Check if OTP matches
  if (otpData.otp === userOtp) {
    delete otpStore[phoneNumber]; // Clear OTP after successful verification
    return true;
  }

  return false;
}
