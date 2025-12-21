
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Paths that require authentication
    const protectedPaths = ['/dashboard', '/groups', '/expenses'];

    // Api paths that require authentication (except auth endpoints)
    const isProtectedApi = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth');

    if (protectedPaths.some(path => pathname.startsWith(path)) || isProtectedApi) {
        if (!token) {
            if (isProtectedApi) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload) {
            if (isProtectedApi) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect authenticated users away from login/signup
    if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
        const payload = await verifyToken(token);
        if (payload) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
