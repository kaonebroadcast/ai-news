import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-utils';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify the OTP
    const isValid = verifyOTP(email, otp);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate a proper JWT token
    // 2. Store the session in your database
    // 3. Set appropriate expiration
    const token = 'jwt_token_' + Math.random().toString(36).substr(2);
    
    // Mock user data - in production, get this from your database
    const user = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    };

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
