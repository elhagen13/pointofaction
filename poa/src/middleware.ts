// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/addCompanyStore(.*)',

]);

export default clerkMiddleware(async (auth, req) => {
    const {userId} = await auth();
    if (isProtectedRoute(req)) {
      if (!userId) {
        return (await auth()).redirectToSignIn({returnBackUrl: req.url})
      }
    }
  });

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};