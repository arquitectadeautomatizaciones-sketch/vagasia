import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = ["/login", "/register", "/marcar", "/demo", "/survey", "/api/survey", "/api/aniversarios-hoje", "/api/satisfacao", "/api/whatsapp", "/api/auth", "/auth", "/suspended"];
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
    // is_active defaults to true when not set (existing users before the column was added)
    const isActive = user.app_metadata?.is_active !== false;

    // Suspended accounts: only /suspended and public routes allowed
    if (!isActive && !pathname.startsWith("/suspended") && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }

    const onboardingDone = !!user.app_metadata?.onboarding_completed;
    const hasBusinessId = !!user.app_metadata?.business_id;
    const isReady = onboardingDone && hasBusinessId;
    const isOnboarding = pathname.startsWith("/onboarding");

    // Auth/landing pages → home screen
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
      return NextResponse.redirect(new URL(isReady ? "/dashboard" : "/onboarding", request.url));
    }

    // Users without a business or incomplete onboarding stay on /onboarding
    // (API routes and /admin exempt — they gate themselves)
    if (!isReady && !isOnboarding && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Fully onboarded users redirected away from /onboarding
    if (isReady && isOnboarding) {
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
