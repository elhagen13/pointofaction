import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Protect all POST, PATCH, DELETE requests to /api routes
  const isMutationMethod = ['POST', 'PATCH', 'DELETE'].includes(req.method);
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  
  if ((isProtectedRoute(req) || (isApiRoute && isMutationMethod)) && !userId) {
    // For API routes, return 401 instead of redirecting
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // For regular pages, redirect to sign in
    return (await auth()).redirectToSignIn({
      returnBackUrl: req.url
    });
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};