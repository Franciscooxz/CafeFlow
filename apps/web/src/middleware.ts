import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['es', 'en', 'pt'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extraer locale del path
  const pathnameHasLocale = ['es', 'en', 'pt'].some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  const pathWithoutLocale = pathnameHasLocale
    ? pathname.replace(/^\/(es|en|pt)/, '')
    : pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p));

  // Rutas de onboarding: accesibles sin redirección adicional
  const isOnboarding = pathWithoutLocale.startsWith('/onboarding');

  // access_token expira a los 15 min; refresh_token (7 días) permite que el
  // interceptor de axios renueve la sesión sin forzar un nuevo login.
  const hasSession =
    request.cookies.has('access_token') || request.cookies.has('refresh_token');

  if (!isPublicPath && !isOnboarding && !hasSession && pathname !== '/') {
    const locale = pathnameHasLocale
      ? pathname.split('/')[1]
      : 'es';
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
