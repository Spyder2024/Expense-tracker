import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xxxmdaazslzgefwydlpg.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_m421-D7S-il68iR3TCMO9w_oRX8092G";

  // If the Supabase URL is still a dummy placeholder or missing, skip network calls to prevent 504 MIDDLEWARE_INVOCATION_TIMEOUT
  if (!supabaseUrl || supabaseUrl.includes("xxxmdaazslzgefwydlpg") || !supabaseUrl.startsWith("http")) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Add a strict 3-second timeout safety guard so middleware never hangs Vercel edge functions
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 3000)
    );

    const authPromise = supabase.auth.getUser();
    const { data } = await Promise.race([authPromise, timeoutPromise]);
    const user = data?.user;

    const { pathname } = request.nextUrl;
    const isAuthPage = pathname.startsWith("/login");

    // Redirect unauthenticated users to /login
    if (!user && !isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from /login to /
    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware auth check failed:", error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
