import { NextResponse } from 'next/server';

// Mock user database - replace with your actual database calls
const mockUsers = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123', // In production, store hashed passwords
    name: 'Test User',
    isVerified: true,
  },
];

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Find the user by email in your database
    // 2. Verify the password (using bcrypt or similar)
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In a real implementation, verify the hashed password
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate a JWT token
    // 2. Set appropriate expiration
    const token = 'auth_token_' + Math.random().toString(36).substr(2);

    // Return user data and token
    // In a real implementation, don't return the password
    // Using _ prefix to indicate this variable is intentionally not used
    const { password: _password, ...userData } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
