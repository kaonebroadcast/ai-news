import { NextResponse } from 'next/server';

// This is a mock implementation - replace with your actual OTP service
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate a 6-digit OTP
    // 2. Store it in your database with an expiration time
    // 3. Send it to the user's email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`OTP for ${email}: ${otp}`); // For development only

    // Mock delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, don't send the OTP back in the response
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
