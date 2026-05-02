import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = ["/login", "/register", "/marcar", "/api/whatsapp", "/api/auth", "/auth"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: não colocar lógica entre createServerClient e getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const onboardingDone = !!user.app_metadata?.onboarding_completed;
    const isOnboarding = pathname.startsWith("/onboarding");

    // From auth/landing pages → onboarding or dashboard
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
      return NextResponse.redirect(
        new URL(onboardingDone ? "/dashboard" : "/onboarding", request.url)
      );
    }

    // Non-onboarded users stay on /onboarding (API routes pass through freely)
    if (!onboardingDone && !isOnboarding && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Already-onboarded users are sent away from /onboarding
    if (onboardingDone && isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
