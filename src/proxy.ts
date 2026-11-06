import { NextResponse, type NextRequest } from 'next/server'

const MAINTENANCE_BYPASS_PREFIXES = [
    '/maintenance',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.webmanifest',
    '/opengraph-image',
    '/twitter-image',
    '/me/admin',
    '/dashboard',
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

    const sessionResponse = NextResponse.next()

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
