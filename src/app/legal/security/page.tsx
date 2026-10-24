import Link from 'next/link';
import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Security',
  description: 'AVRXT security controls across the main site, profile, and Muzix for OAuth, private email links, public media, database access, search, caching, monitoring, and responsible disclosure.',
  keywords: ['avrxt security', 'responsible disclosure', 'OAuth security', 'API rate limiting', 'security headers', 'vulnerability report', 'website security'],
  path: '/legal/security',
});

const nav = [
  { id: 'approach', label: 'Security approach' }, { id: 'web', label: 'Web safeguards' }, { id: 'data', label: 'Data and access' }, { id: 'tools', label: 'Tool protections' }, { id: 'report', label: 'Report a vulnerability' }, { id: 'research', label: 'Research rules' }, { id: 'response', label: 'Response and limits' },
];

export default function SecurityPage() {
  return <PolicyShell eyebrow="Trust center" title="Security" description="How AVRXT websites reduce common web risk, protect interactive features, and work with researchers who report vulnerabilities responsibly." version="v5.7" lastUpdated="24 October 2026" updatedBy={{ handle: '@error', profileUrl: 'https://discord.com/users/1332903068899213363', avatarUrl: 'https://cdn.avrxt.dev/team/erroraero-avatar-1024.png' }} nav={nav} highlights={[{ label: 'Disclosure channel', value: 'support@avrxt.dev' }, { label: 'Transport', value: 'HTTPS + HSTS' }, { label: 'Email links', value: 'Explicit confirmation' }]}>
    <PolicySection id="approach" number="01" title="Security approach">
      <p>Security is treated as an ongoing engineering process rather than a guarantee or certification. Controls are selected for the actual risk across www.avrxt.dev, me.avrxt.dev, and muzix.avrxt.dev: public forms and utilities, newsletter delivery, administrator-only features, GitHub, Discord and Spotify OAuth connections, public music data, and third-party infrastructure.</p>
      <p>No internet service is completely secure. This page describes controls visible in the current application and avoids claiming a specific audit result, cipher suite, recovery target, or compliance certification that has not been independently verified.</p>
    </PolicySection>

    <PolicySection id="web" number="02" title="Web and browser safeguards">
      <PolicyList items={[
        <><strong>Encrypted transport:</strong> AVRXT web properties are served over HTTPS. The main application sends a long-lived HSTS policy; independently hosted properties are protected by their hosting and CDN TLS configuration.</>,
        <><strong>Content controls:</strong> Content Security Policy restricts resource categories and names specific script, frame, and font sources. HTTPS images, media, and connections have broader allowances for connected features. The Vercel toolbar origin is allowed only on preview deployments.</>,
        <><strong>Browser isolation:</strong> frame, content-type, referrer, permissions, opener, and cross-domain policy headers reduce common browser attack paths.</>,
        <><strong>Safer rendering:</strong> user-supplied contact content is validated, length-limited, and HTML-escaped before it is relayed.</>,
      ]} />
      <PolicyCallout title="About CSP">The current Next.js build still requires inline framework scripts. Moving to a nonce-based strict CSP is a future hardening option and would require request-time nonce propagation across the application.</PolicyCallout>
    </PolicySection>

    <PolicySection id="data" number="03" title="Data, identity, and privileged access">
      <p>Secrets, email credentials, OAuth client secrets, and Spotify access or refresh tokens are expected to remain in server-side environment configuration and are not intentionally exposed to client JavaScript. Authentication uses provider-backed OAuth flows, security-state checks, HTTP-only cookies where applicable, and server-side authorization for restricted routes. The public profile and Muzix frontends use approved public API responses and do not receive administrator or Spotify credentials.</p>
      <p>Public Muzix responses contain selected listening information rather than credentials. Operational data is handled through providers such as Vercel, Cloudflare, Supabase, Resend, Discord, GitHub, Discord, and Spotify. Those systems maintain their own infrastructure controls. Access should be limited to what is required to operate and support the site.</p>
      <PolicyList items={[
        <><strong>Discord administration:</strong> login uses OAuth state and PKCE. The application verifies signed sessions and their audience, then checks current server membership and the required role, or the configured owner identity. Provider errors deny access with a distinct verification error rather than proving a role is absent.</>,
        <><strong>Database access:</strong> Supabase row-level security separates published content from drafts and server-only integration, newsletter, and rate-limit records. Service credentials remain on the server; private admin reads do not use the public Redis cache.</>,
        <><strong>Public status:</strong> the application reads fixed public Better Stack JSON endpoints and exposes only approved display fields. Fetches have time and size limits; provider text is rendered as plain text. The database health probe requires a server-only bearer token, performs a bounded read through the anonymous/RLS client, and returns health without records or detailed errors. Monitoring credentials are not sent to browsers.</>,
        <><strong>Public search:</strong> the browser uses a search-only Algolia key restricted to the public index, website referers, and bounded requests. The index writer and scheduled synchronization secret remain server-side. Only the anonymous database client supplies published content. Search results render plain text and accept only known public routes. Preview deployments cannot rewrite the Production index.</>,
        <><strong>Redis:</strong> Upstash REST requests use authenticated HTTPS. Public caches use expiry and invalidation, separate deployment namespaces, and fill locks. Rate limiting uses shared Redis counters with a database fallback; production requests fail closed if the configured distributed protection cannot run.</>,
        <><strong>Media uploads:</strong> R2 credentials are restricted to the media bucket. Authenticated administrators obtain short-lived signed upload URLs; the application validates supported types and sizes, generates filenames, and checks the stored object’s size and declared content type before completion. Bucket CORS limits browser upload origins.</>,
      ]} />
      <PolicyCallout title="Public media and file validation">cdn.avrxt.dev serves published media publicly. Signed upload URLs protect upload authorization, not the confidentiality of downloaded files. Size and declared-type checks are not malware scanning, file-content verification, or automatic removal of embedded metadata.</PolicyCallout>
      <p>Authentication storage applies expiration to session records and runs scheduled cleanup to minimize legacy identity data and retire redundant signing keys with a grace period. It is not intended to retain a permanent record of every login. Cleanup is bounded and provider-dependent, so it is not an immediate-erasure guarantee for all logs, backups, or expired records.</p>
      <p>The prepared Amazon SES identity for notify.avrxt.dev uses 2048-bit DKIM and a custom bounce.notify.avrxt.dev MAIL FROM domain in Mumbai. Its DNS records are served by the delegated Route 53 zone. SES is configured to reject sending through that custom return path if its MX verification fails, and account-level suppression is enabled for bounces and complaints. Production access is pending and SES is not yet connected to website delivery; these settings do not establish a complete application-level feedback-processing integration.</p>
    </PolicySection>

    <PolicySection id="tools" number="04" title="Abuse resistance in public tools">
      <PolicyList items={[
        'Public API requests use route-specific validation, rate limits where applicable, and explicit JSON body-size limits.',
        'Contact submissions enforce same-origin checks, validation, length limits, and email-address syntax checks.',
        'Newsletter submissions validate address format, limit attempts, reject known disposable or prohibited addresses, and require email confirmation before enrollment. Confirmation and unsubscribe records store token hashes; confirmation requires an explicit action rather than a link preview alone.',
        'Confirmation tokens expire after 24 hours. A consumed token cannot schedule another welcome email; welcome delivery uses bounded retries with the same provider idempotency key to reduce duplicate messages.',
        'Email preferences are processed by the website, with a read-only link lookup and an explicit same-origin POST to unsubscribe. Missing or invalid tokens do not change membership. The provider opt-out must succeed before the database records completion, and completed requests are safe to repeat.',
        'Private confirmation and preference pages use no-store and noindex headers, restrict cross-origin referrers, and exclude the application’s analytics and Ask AI features. Preference responses do not disclose the subscriber address, and the browser removes the token from its visible URL after loading. Treat the original link as a credential; it may still reach infrastructure logs or email-link scanners.',
        'Published Markdown is sanitized to remove scripts and privileged HTML. URL-preview requests reject private or reserved addresses and validate redirects before fetching a target.',
        'The TCP port checker requires an authorization acknowledgement, resolves the target server-side, and blocks private, local, reserved, and mixed-address targets.',
        'DNS and external lookups use bounded timeouts so an unavailable provider does not hold a request indefinitely.',
        'The keyboard tester processes keystrokes only inside the focused browser component and does not send key history to an API.',
        'The website terminal uses an explicit public-page catalog and renders command text as plain text. It does not execute operating-system commands, evaluate code, accept arbitrary navigation URLs, or bypass administrator authorization. Input length and in-memory history are bounded.',
        'Ask AI builds its prompt in the browser and opens a provider only after a user action; no provider is contacted merely by displaying the launcher.',
      ]} />
    </PolicySection>

    <PolicySection id="report" number="05" title="Report a suspected vulnerability">
      <p>Send a private report to <a href="mailto:support@avrxt.dev?subject=Security%20report">support@avrxt.dev</a> with “Security report” in the subject. Include the affected www.avrxt.dev URL or feature, a concise description, reproducible steps, expected impact, and any safe proof-of-concept material.</p>
      <p>Do not include personal data copied from another user, active credentials, destructive payloads, or a public disclosure link. If sensitive evidence is necessary, first ask for a safer transfer method.</p>
      <p>The <Link href="/delete-request">data-deletion request form</Link> uses random 24-hour verification tokens stored as hashes, explicit same-origin confirmation, and private database access. Contact messages go directly to Discord without verification; their submitted addresses are labeled unverified and must not establish ownership or authorize data access. Both forms enforce same-origin submissions, bounded bodies, honeypots, and per-IP and per-email limits. Webhook URLs stay server-side; mentions are disabled in Discord embeds. Deletion verification pages exclude application analytics and Ask AI. Requests are reviewed manually; submitting the form does not run destructive database actions. Deletion delivery uses a processing lease and request reference to reduce duplicate notifications; an uncertain network failure can still require operator reconciliation.</p>
      <p>For an email-link issue, redact the confirmation or unsubscribe token and provide the page path, approximate time, visible error, and steps instead. Never forward another person’s private link as evidence. Privacy, deletion, and newsletter-support requests can also be sent to support@avrxt.dev, but should be identified separately from a vulnerability report.</p>
    </PolicySection>

    <PolicySection id="research" number="06" title="Good-faith research boundaries">
      <p>AVRXT welcomes good-faith reports that minimize harm. Researchers should stop once a vulnerability is confirmed and allow reasonable time for investigation before publication.</p>
      <PolicyList items={[
        'Limit testing to AVRXT-operated features and accounts you own or are explicitly authorized to test. An AVRXT subdomain or link is not permission to test a provider’s underlying systems; follow that provider’s separate research policy.',
        'Do not access, alter, retain, or disclose another person’s data.',
        'Do not use denial-of-service, social engineering, spam, malware, physical attacks, or automated high-volume scanning.',
        'Do not degrade availability, bypass payment, or create costs for AVRXT or its providers.',
        'Comply with applicable law and third-party platform rules.',
      ]} />
      <PolicyCallout title="No standing bounty promise">This disclosure channel does not promise a monetary reward. Any recognition or reward is discretionary and must be confirmed in writing.</PolicyCallout>
    </PolicySection>

    <PolicySection id="response" number="07" title="Triage, remediation, and limitations">
      <p>Reports are prioritized by reproducibility, affected data, required access, and realistic impact. AVRXT may ask follow-up questions, deploy temporary mitigations, coordinate with a hosting provider, or close reports that are informational, duplicate, outside scope, or not reproducible.</p>
      <p>Security controls and provider configurations evolve. This page is not a warranty that every issue will be prevented, discovered, or resolved within a fixed time. Suspected account compromise or unlawful activity may also be reported to the relevant provider or authority.</p>
    </PolicySection>
  </PolicyShell>;
}
