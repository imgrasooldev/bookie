import { NextResponse, type NextRequest } from "next/server";

// Protect the customer portal: no session cookie → redirect to /login.
export function middleware(req: NextRequest) {
  const session = req.cookies.get("bookie_session")?.value;
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
