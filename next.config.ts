import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable environment variables for IP whitelisting
  env: {
    // This will be available in the browser as process.env.NEXT_PUBLIC_ALLOWED_IPS
    // Example: NEXT_PUBLIC_ALLOWED_IPS='192.168.1.1,192.168.1.0/24'
  },
};

export default nextConfig;
