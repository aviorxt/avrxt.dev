import { NextResponse, type NextRequest } from 'next/server'
import { getOpenAuthClient } from '@/lib/openauth'
import { authSubjects } from '../auth-worker/subjects'

const MAINTENANCE_BYPASS_PREFIXES = [
    '/maintenance',
    '/me/admin',
    '/docs/admin',
    '/mail',
    '/auth',
    '/api',
    '/preferance/mail/unsub',
    '/delete-request',
    '/contact/confirm',
    '/api/delete-request',
    '/api/requests/confirm',
    '/preference/mail/unsub',
]

async function isMaintenanceModeEnabled() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return false

    try {
        const { getPublicMaintenance } = await import('@/lib/public-data')
        return await getPublicMaintenance()
    } catch (error) {
        console.error('[MAINTENANCE_CHECK_FAILED]', error)
        return false
    }
}

export default async function proxy(request: NextRequest) {
    const url = request.nextUrl

    const requestHeaders = new Headers(request.headers)
    let refreshedTokens: { access: string; refresh: string } | undefined
    const access = request.cookies.get('avrxt_access')?.value
    const refresh = request.cookies.get('avrxt_refresh')?.value
    if (access && refresh && (url.pathname.startsWith('/me/admin') || url.pathname.startsWith('/docs/admin'))) {
        try {
            const verified = await getOpenAuthClient().verify(authSubjects, access, { refresh })
            if (!verified.err && verified.aud === 'avrxt-web' && verified.tokens) {
                refreshedTokens = verified.tokens
                request.cookies.set('avrxt_access', verified.tokens.access)
                request.cookies.set('avrxt_refresh', verified.tokens.refresh)
                requestHeaders.set('cookie', request.cookies.toString())
            }
        } catch { /* Authorization checks will reject an invalid session. */ }
    }

    const sessionResponse = NextResponse.next({ request: { headers: requestHeaders } })
    if (refreshedTokens) {
        const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 2592000 }
        sessionResponse.cookies.set('avrxt_access', refreshedTokens.access, options)
        sessionResponse.cookies.set('avrxt_refresh', refreshedTokens.refresh, options)
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
