import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/verify", "/_next", "/favicon", "/logo", "/images"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public routes through — AuthGuard handles
  // role-based protection client-side
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|images|public).*)",
  ],
};