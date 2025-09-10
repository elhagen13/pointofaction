/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          // Apply these headers to all API routes
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: process.env.NODE_ENV === 'production' 
                ? 'https://www.pointofaction.com' 
                : 'http://localhost:3000'
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization, X-API-Key'
            },
            {
              key: 'Access-Control-Allow-Credentials',
              value: 'true'
            }
          ],
        },
      ];
    },
  };
  
  export default nextConfig;