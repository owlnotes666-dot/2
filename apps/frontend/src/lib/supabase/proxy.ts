import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeRedirectPath } from "@/features/auth/utils/getSafeRedirectPath";

const protectedRoutes = [
  "/",
  "/users",
  "/upload",
  "/products",
  "/profile",
  "/orders",
  "/calendar",
  "/sales",
  "/appointments",
  "/patients",
  "/doctors",
  "/medical-records",
  "/staff",
  "/settings",
  "/ai-assistant",
  "/knowledge-base",
  "/analytics",
];

const authRoutes = ["/signin", "/signup"];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

function getAuthUnavailableResponse(error: unknown) {
  if (!isAuthRetryableFetchError(error)) {
    return null;
  }

  console.error("Supabase authentication is temporarily unavailable", error);

  return NextResponse.json(
    { error: "Authentication service is temporarily unavailable." },
    {
      status: 503,
      headers: { "Retry-After": "5" },
    },
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const authCookieUpdates = new Map<string, {
    name: string;
    value: string;
    options?: Parameters<typeof supabaseResponse.cookies.set>[2];
  }>();

  const applyAuthCookies = (response: NextResponse) => {
    authCookieUpdates.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            authCookieUpdates.set(name, { name, value, options });
          });
          supabaseResponse = NextResponse.next({ request });
          applyAuthCookies(supabaseResponse);
        },
      },
    },
  );

  let claimsResult;
  try {
    claimsResult = await supabase.auth.getClaims();
  } catch (error) {
    const unavailableResponse = getAuthUnavailableResponse(error);
    if (unavailableResponse) {
      return unavailableResponse;
    }

    throw error;
  }

  const { data, error } = claimsResult;

  if (error) {
    const unavailableResponse = getAuthUnavailableResponse(error);
    if (unavailableResponse) {
      return unavailableResponse;
    }

    throw error;
  }

  const pathname = request.nextUrl.pathname;

  const isAuthenticated = Boolean(data?.claims);

  /*
   * User is NOT authenticated
   * → Protected route → /signin
   */
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();

    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    const redirectResponse = NextResponse.redirect(url);
    applyAuthCookies(redirectResponse);
    return redirectResponse;
  }

  /*
   * User IS authenticated
   * → /signin or /signup → original destination
   */
  if (isAuthenticated && isAuthRoute(pathname)) {
    const redirectPath = getSafeRedirectPath(
      request.nextUrl.searchParams.get("next"),
    );
    const url = new URL(redirectPath, request.url);

    const redirectResponse = NextResponse.redirect(url);
    applyAuthCookies(redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
