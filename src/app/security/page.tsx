import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Security',
  description: 'Security controls, safe testing boundaries, and the responsible vulnerability disclosure process for avrxt.dev.',
  keywords: ['avrxt security', 'responsible disclosure', 'security headers', 'vulnerability report', 'website security'],
  path: '/security',
});

const nav = [
  { id: 'approach', label: 'Security approach' }, { id: 'web', label: 'Web safeguards' }, { id: 'data', label: 'Data and access' }, { id: 'tools', label: 'Tool protections' }, { id: 'report', label: 'Report a vulnerability' }, { id: 'research', label: 'Research rules' }, { id: 'response', label: 'Response and limits' },
];

export default function SecurityPage() {
  return <PolicyShell eyebrow="Trust center" title="Security" description="How avrxt.dev reduces common web risk, protects interactive features, and works with researchers who report vulnerabilities responsibly." version="v3.0" lastUpdated="8 October 2026" nav={nav} highlights={[{ label: 'Disclosure channel', value: 'support@avrxt.dev' }, { label: 'Transport', value: 'HTTPS + HSTS' }, { label: 'Public tools', value: 'Guarded and rate-limited' }]}>
    <PolicySection id="approach" number="01" title="Security approach">
      <p>Security is treated as an ongoing engineering process rather than a guarantee or certification. Controls are selected for the site’s actual risk: public forms and utilities, administrator-only features, OAuth connections, email delivery, and third-party infrastructure.</p>
      <p>No internet service is completely secure. This page describes controls visible in the current application and avoids claiming a specific audit result, cipher suite, recovery target, or compliance certification that has not been independently verified.</p>
    </PolicySection>

    <PolicySection id="web" number="02" title="Web and browser safeguards">
      <PolicyList items={[
        <><strong>Encrypted transport:</strong> the deployed site is served over HTTPS and sends a long-lived HSTS policy.</>,
        <><strong>Content controls:</strong> Content Security Policy limits scripts, frames, fonts, media, and other resources to approved sources; the Vercel toolbar origin is allowed only on preview deployments.</>,
        <><strong>Browser isolation:</strong> frame, content-type, referrer, permissions, opener, and cross-domain policy headers reduce common browser attack paths.</>,
        <><strong>Safer rendering:</strong> user-supplied contact content is validated, length-limited, and HTML-escaped before it is relayed.</>,
      ]} />
      <PolicyCallout title="About CSP">The current Next.js build still requires inline framework scripts. Moving to a nonce-based strict CSP is a future hardening option and would require request-time nonce propagation across the application.</PolicyCallout>
    </PolicySection>

    <PolicySection id="data" number="03" title="Data, identity, and privileged access">
      <p>Secrets are expected to remain in server-side environment configuration and are not intentionally exposed to client JavaScript. Authentication uses provider-backed OAuth flows, security-state checks, HTTP-only cookies where applicable, and server-side authorization for restricted routes.</p>
      <p>Operational data is handled through providers such as Vercel, Cloudflare, Supabase, Resend, Gmail, GitHub, Discord, and Spotify. Those systems maintain their own infrastructure controls. Access should be limited to what is required to operate and support the site.</p>
    </PolicySection>

    <PolicySection id="tools" number="04" title="Abuse resistance in public tools">
      <PolicyList items={[
        'Public API requests are rate-limited and JSON request bodies have explicit size limits.',
        'Contact submissions enforce same-origin checks, validation, length limits, and email-address syntax checks.',
        'The port checker requires an authorization acknowledgement, resolves the target server-side, and blocks private, local, reserved, and mixed-address targets.',
        'DNS and external lookups use bounded timeouts so an unavailable provider does not hold a request indefinitely.',
        'The keyboard tester processes keystrokes only inside the focused browser component and does not send key history to an API.',
      ]} />
    </PolicySection>

    <PolicySection id="report" number="05" title="Report a suspected vulnerability">
      <p>Send a private report to <a href="mailto:support@avrxt.dev?subject=Security%20report">support@avrxt.dev</a> with “Security report” in the subject. Include the affected URL or feature, a concise description, reproducible steps, expected impact, and any safe proof-of-concept material.</p>
      <p>Do not include personal data copied from another user, active credentials, destructive payloads, or a public disclosure link. If sensitive evidence is necessary, first ask for a safer transfer method.</p>
    </PolicySection>

    <PolicySection id="research" number="06" title="Good-faith research boundaries">
      <p>AVRXT welcomes good-faith reports that minimize harm. Researchers should stop once a vulnerability is confirmed and allow reasonable time for investigation before publication.</p>
      <PolicyList items={[
        'Test only avrxt.dev systems and accounts you own or are authorized to use.',
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
