import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = ["/login", "/register", "/marcar", "/demo", "/survey", "/api/survey", "/api/aniversarios-hoje", "/api/satisfacao", "/api/whatsapp", "/api/auth", "/auth", "/suspended", "/subscribe", "/api/stripe/webhook"];

const TRIAL_DAYS = 7;

function trialDaysRemaining(trialStartedAt: string): number {
  const elapsed = Date.now() - new Date(trialStartedAt).getTime();
  const remaining = TRIAL_DAYS - elapsed / (1000 * 60 * 60 * 24);
  return Math.ceil(remaining);
}

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
    const isActive = user.app_metadata?.is_active === true;
    const trialStartedAt = user.app_metadata?.trial_started_at as string | undefined;
    const inTrial = !!trialStartedAt && trialDaysRemaining(trialStartedAt) > 0;

    // Tem acesso se tem subscrição Stripe ativa OU está em período de trial
    const hasAccess = isActive || inTrial;

    const onboardingDone = !!user.app_metadata?.onboarding_completed;
    const hasBusinessId = !!user.app_metadata?.business_id;
    const isReady = onboardingDone && hasBusinessId;
    const isOnboarding = pathname.startsWith("/onboarding");
    const isSubscribePage = pathname.startsWith("/subscribe");

    // Auth/landing pages → redirecionar para o destino certo
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
      if (!isReady) return NextResponse.redirect(new URL("/onboarding", request.url));
      if (!hasAccess) return NextResponse.redirect(new URL("/subscribe", request.url));
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Onboarding incompleto → forçar /onboarding (exceto API e admin)
    if (!isReady && !isOnboarding && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Onboarding feito mas sem acesso → /subscribe (exceto API, admin e /subscribe em si)
    if (isReady && !hasAccess && !isSubscribePage && !pathname.startsWith("/suspended") && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/subscribe", request.url));
    }

    // Onboarding completo com acesso → sair do /onboarding
    if (isReady && hasAccess && isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Onboarding completo sem acesso → sair do /onboarding para /subscribe
    if (isReady && !hasAccess && isOnboarding) {
      return NextResponse.redirect(new URL("/subscribe", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
