import { NextResponse } from 'next/server';
import { generateOTP, otpStore } from '@/lib/otp-utils';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate a new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // In production, you would send the OTP via SMS here
    console.log(`New OTP for ${phoneNumber}: ${otp}`);

    // Store the new OTP
    otpStore[phoneNumber] = { otp, expiresAt };

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      // In development, return the OTP for testing
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to resend OTP' },
      { status: 500 }
    );
  }
}
