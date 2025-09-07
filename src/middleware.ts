import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the client's IP address from headers
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
  
  // Get allowed IPs from environment variable
  const allowedIps = process.env.ALLOWED_IPS?.split(',') || [];
  
  // Add localhost IPs for development
  const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  const allAllowedIps = [...allowedIps, ...localhostIps];
  
  // Check if the request is for an API route or static files
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticFile = request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
  
  // Allow API routes and static files to bypass IP check
  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }
  
  // Check if client IP is allowed
  const isAllowed = allAllowedIps.some(ip => {
    // Handle IP ranges (e.g., 192.168.1.0/24)
    if (ip.includes('/')) {
      return isIpInRange(clientIp, ip);
    }
    return clientIp === ip;
  });
  
  // If not allowed, show access denied page
  if (!isAllowed) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Access Denied</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background-color: #f3f4f6;
              color: #1f2937;
              text-align: center;
              padding: 0 1rem;
            }
            .container { 
              max-width: 32rem;
              padding: 2rem;
              background: white;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            h1 { 
              font-size: 1.5rem; 
              font-weight: 600; 
              margin-bottom: 1rem;
              color: #dc2626;
            }
            p { 
              margin-bottom: 1.5rem; 
              color: #4b5563;
            }
            .ip {
              font-family: monospace;
              background-color: #f3f4f6;
              padding: 0.25rem 0.5rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Access Denied</h1>
            <p>Your IP address <span class="ip">${clientIp}</span> is not authorized to access this site.</p>
            <p>Please contact the administrator if you believe this is an error.</p>
          </div>
        </body>
      </html>`, 
      { 
        status: 403, 
        headers: { 
          'content-type': 'text/html',
        } 
      }
    );
  }
  
  return NextResponse.next();
}

// Helper function to check if IP is in a specific range
function isIpInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits = '32'] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1) >>> 0;
    const ipLong = ipToLong(ip);
    const rangeLong = ipToLong(range);
    return (ipLong & mask) === (rangeLong & mask);
  } catch (e) {
    console.error('Error checking IP range:', e);
    return false;
  }
}

// Helper function to convert IP to long number
function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet, index) => {
    return acc + (parseInt(octet, 10) << (8 * (3 - index)));
  }, 0) >>> 0;
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
