import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // FALLBACK: Hardcoded values because Vercel Env Vars are failing to load
    const HARDCODED_URL = 'https://qolozennlzllvrqmibls.supabase.co'
    const HARDCODED_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbG96ZW5ubHpsbHZycW1pYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE1MjcsImV4cCI6MjA4NTQyNzUyN30.vu549GpXoQGGMwVs92PB4IC8IL9hniLWS9FDLsl28M8'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_ANON

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // FORCE PASSWORD CHANGE CHECK
    // If user is logged in AND has data.requires_password_change === true
    if (user && user.user_metadata?.requires_password_change) {
        const isUpdatePage = request.nextUrl.pathname.startsWith('/auth/update-password')
        const isSignOut = request.nextUrl.pathname.startsWith('/auth/signout')
        const isApi = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/auth/v1')
        const isStatic = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('.')

        if (!isUpdatePage && !isSignOut && !isApi && !isStatic) {
            console.log(`🔒 FORCE PASSWORD CHANGE: Redirecting ${request.nextUrl.pathname} to /auth/update-password`)
            return NextResponse.redirect(new URL('/auth/update-password', request.url))
        }
    }

    // PROTECTED ROUTES CHECK (Optional - currently handled by Layout/Context but good to have here)
    // If no user and trying to access protected routes
    if (!user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/settings'))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
