import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  const isMutationMethod = ["POST", "PATCH", "DELETE"].includes(req.method);
  const isApiRoute = pathname.startsWith("/api");

  // 🔐 AUTH PROTECTION (unchanged logic)
  const isTrackerRoute = pathname === "/api/tracker";

  if (
    (isProtectedRoute(req) ||
      (isApiRoute && isMutationMethod && !isTrackerRoute)) &&
    !userId
  ) {
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return (await auth()).redirectToSignIn({
      returnBackUrl: req.url,
    });
  }

  

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
