import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, ROLE_COOKIE, verifyAuthToken } from "../shared/jwt";

const STAFF_ROLES = new Set([
  "verification_officer",
  "sales_admin",
  "super_admin",
]);

const VENDOR_ROLES = new Set(["vendor", "vendor_employee"]);

const customerPrefixes = [
  "/dashboard",
  "/profile",
  "/sell-property",
  "/my-property",
  "/notifications",
  "/seek-vendor",
  "/materials",
];

const vendorPrefixes = ["/vendor"];

const adminPrefixes = ["/admin"];

const authPages = new Set([
  "/login",
  "/register",
  "/register/vendor",
  "/admin-login",
]);

function clearAuthCookies(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set("csc_session", "", { path: "/", maxAge: 0 });
}

function homeForRole(role: string): string {
  if (STAFF_ROLES.has(role)) return "/admin/dashboard";
  if (VENDOR_ROLES.has(role)) return "/vendor/dashboard";
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = await verifyAuthToken(token);
  const hasSession = Boolean(payload?.sub);
  const role = (payload?.role as string) || "";

  const needsBuyCheckout =
    pathname.startsWith("/buy-property/") && pathname !== "/buy-property/";
  const needsCustomer =
    needsBuyCheckout ||
    customerPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  const needsVendor = vendorPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const needsAdmin = adminPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const needsAuth = needsCustomer || needsVendor || needsAdmin;
  const isAuthPage = authPages.has(pathname);

  // Dead / expired JWT on protected or auth pages → clear and send to login
  if (token && !payload) {
    if (needsAuth || isAuthPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = needsAdmin ? "/admin-login" : "/login";
      if (needsAuth) loginUrl.searchParams.set("next", pathname);
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }
    const res = NextResponse.next();
    clearAuthCookies(res);
    return res;
  }

  if (needsAuth && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = needsAdmin ? "/admin-login" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin && hasSession && role && !STAFF_ROLES.has(role)) {
    const dash = request.nextUrl.clone();
    dash.pathname = homeForRole(role);
    return NextResponse.redirect(dash);
  }

  if (needsVendor && hasSession && role && !VENDOR_ROLES.has(role)) {
    const dash = request.nextUrl.clone();
    dash.pathname = homeForRole(role);
    return NextResponse.redirect(dash);
  }

  // Do NOT bounce /login away based on JWT alone.
  // Demo store resets wipe users while cookies remain; /api/auth/me clears
  // orphan sessions, and the login page redirects only after a live user check.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/sell-property/:path*",
    "/buy-property/:path*",
    "/my-property/:path*",
    "/notifications/:path*",
    "/seek-vendor/:path*",
    "/materials/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/register/vendor",
    "/admin-login",
  ],
};
