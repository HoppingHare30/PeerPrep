import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Define route lists
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path === '/verify';
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/search') || 
    path.startsWith('/profile') || 
    path.startsWith('/sessions') || 
    path.startsWith('/session') || 
    path.startsWith('/onboarding') || 
    path.startsWith('/admin');

  if (isProtectedRoute && !user) {
    // Redirect unauthenticated user to login
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    // User is logged in, fetch profile onboarding status and role
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete, role')
      .eq('id', user.id)
      .single();

    const onboardingComplete = profile?.onboarding_complete || false;
    const role = profile?.role || 'user';

    // 1. Gate /admin route for admins only
    if (path.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // 2. Gate onboarding complete redirect
    if (!onboardingComplete && path !== '/onboarding' && isProtectedRoute) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // 3. Gate onboarding page if already completed
    if (onboardingComplete && path === '/onboarding') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // 4. Redirect authed users away from login/signup/verify
    if (isAuthRoute) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
