import { NextResponse, type NextRequest } from 'next/server'
import { getOpenAuthClient } from '@/lib/openauth'
import { authSubjects } from '../auth-worker/subjects'
import { getPublicMaintenance } from '@/lib/public-data'

const MAINTENANCE_BYPASS_PREFIXES = [
    '/maintenance',
    '/me/admin',
    '/docs/admin',
    '/mail',
    '/auth',
    '/api',
]

async function isMaintenanceModeEnabled() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return false

    try {
        return await getPublicMaintenance()
    } catch (error) {
        console.error('[MAINTENANCE_CHECK_FAILED]', error)
        return false
    }
}

export default async function proxy(request: NextRequest) {
    const url = request.nextUrl

    const sessionResponse = NextResponse.next({ request })
    const access = request.cookies.get('avrxt_access')?.value
    const refresh = request.cookies.get('avrxt_refresh')?.value
    if (access && refresh && (url.pathname.startsWith('/me/admin') || url.pathname.startsWith('/docs/admin'))) {
        try {
            const verified = await getOpenAuthClient().verify(authSubjects, access, { refresh })
            if (!verified.err && verified.tokens) {
                const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 2592000 }
                sessionResponse.cookies.set('avrxt_access', verified.tokens.access, options)
                sessionResponse.cookies.set('avrxt_refresh', verified.tokens.refresh, options)
            }
        } catch { /* Authorization checks will reject an invalid session. */ }
    }

    const bypassesMaintenance = MAINTENANCE_BYPASS_PREFIXES.some(prefix =>
        url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    )

    if (!bypassesMaintenance && await isMaintenanceModeEnabled()) {
        const maintenanceUrl = url.clone()
        maintenanceUrl.pathname = '/maintenance'
        maintenanceUrl.search = ''
        const redirectResponse = NextResponse.redirect(maintenanceUrl)
        sessionResponse.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
        return redirectResponse
    }

    return sessionResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (internal API routes)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
