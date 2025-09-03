import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  let user = null;
  const userCookie = request.cookies.get("user")?.value;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      user = null;
    }
  }

  const url = request.nextUrl.clone();
  const protectedRoutes = ["/gate", "/checkpoint", "/admin"];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token || !user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (url.pathname.startsWith("/admin")) {
    if (!user || user.role !== "admin") {
      url.pathname = "/gate";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/login") && token) {
    return NextResponse.redirect(new URL("/gate", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/gate/:path*", "/checkpoint/:path*", "/admin/:path*"],
};
