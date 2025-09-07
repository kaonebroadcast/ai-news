import { NextResponse } from 'next/server';
import { generateOTP, otpStore } from '@/lib/otp-utils';

// In a real app, you would use a proper OTP service like Twilio, Firebase, or a custom SMS service
// This is a mock implementation for demonstration

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    // In production, you would send the OTP via SMS here
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    // Store OTP (in-memory, replace with a database in production)
    otpStore[phoneNumber] = { otp, expiresAt };

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, don't send the OTP back in the response
      // This is just for demonstration
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
