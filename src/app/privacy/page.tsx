import Link from 'next/link';
import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'How avrxt.dev handles contact details, account information, tool requests, analytics, cookies, and privacy requests.',
  keywords: ['privacy policy', 'avrxt privacy', 'cookies', 'Vercel Analytics', 'personal data', 'data request'],
  path: '/privacy',
});

const nav = [
  { id: 'scope', label: 'Scope and contact' }, { id: 'collect', label: 'Information handled' }, { id: 'tools', label: 'Tool processing' }, { id: 'analytics', label: 'Analytics and logs' }, { id: 'cookies', label: 'Cookies and storage' }, { id: 'providers', label: 'Service providers' }, { id: 'retention', label: 'Use and retention' }, { id: 'rights', label: 'Your choices' }, { id: 'security', label: 'Security and changes' },
];

export default function PrivacyPage() {
  return <PolicyShell eyebrow="Data use" title="Privacy policy" description="A transparent account of the information this website receives, where requested features send it, and the choices available to you." version="v3.0" lastUpdated="8 October 2026" nav={nav} highlights={[{ label: 'Advertising', value: 'No ad network' }, { label: 'Web analytics', value: 'Cookieless and aggregated' }, { label: 'Privacy requests', value: 'support@avrxt.dev' }]}>
    <PolicySection id="scope" number="01" title="Scope, operator, and contact">
      <p>This policy covers avrxt.dev, its public forms and tools, website authentication, newsletter features, and connected profile services operated by AVRXT. Separate policies may apply to a Discord application, a client project, or a third-party website.</p>
      <p>Questions or requests about information handled through this site can be sent to <a href="mailto:support@avrxt.dev">support@avrxt.dev</a>. This notice describes the current product; it is not a blanket certification under every privacy law.</p>
    </PolicySection>

    <PolicySection id="collect" number="02" title="Information the site handles">
      <PolicyList items={[
        <><strong>Contact:</strong> name, email address, and message are validated and relayed through Gmail so AVRXT can respond.</>,
        <><strong>Newsletter:</strong> email address, subscription status, audience reference, and a hash of the unsubscribe token are handled through Resend and Supabase.</>,
        <><strong>Sign-in:</strong> identity details returned by GitHub or Discord, OAuth state, session information, and access roles are used to establish and protect your session.</>,
        <><strong>Technical requests:</strong> IP address, user agent, requested route, timestamps, and similar request details may be processed by hosting, security, authentication, and delivery providers.</>,
        <><strong>Connected features:</strong> profile integrations may process data returned by Spotify, Discord/Lanyard, YouTube, or weather services when those features are enabled.</>,
      ]} />
      <p>Do not submit passwords, full payment-card details, government identifiers, health information, or other sensitive information through ordinary contact fields.</p>
    </PolicySection>

    <PolicySection id="tools" number="03" title="How the public tools process requests">
      <p>Tool inputs are used to produce the result you request. The application does not intentionally create a user profile from tool history, although hosting and upstream providers may keep ordinary security or operational logs.</p>
      <PolicyList items={[
        <><strong>IP lookup:</strong> the request IP and browser details are returned to you; public network information is enriched through ipwho.is.</>,
        <><strong>DNS and registration:</strong> domains and record types are sent to Cloudflare DNS-over-HTTPS and, when requested, RDAP services.</>,
        <><strong>Port checker:</strong> the public hostname or IP and TCP port are resolved and tested from the server. The target host will receive the connection attempt.</>,
        <><strong>Mailfy:</strong> the submitted address is checked for syntax and its domain is queried for MX records; the mailbox is not contacted or proven to exist.</>,
        <><strong>Font UI:</strong> the chosen Google Font is requested from Google Fonts. Preview text remains in your browser.</>,
        <><strong>Spotify and quotes:</strong> Spotify links use Spotify’s official embed; random quotes are requested from DummyJSON.</>,
        <><strong>Keytest:</strong> key presses, history, RGB settings, and statistics remain in browser memory and are not sent to a tool API.</>,
      ]} />
    </PolicySection>

    <PolicySection id="analytics" number="04" title="Web analytics and infrastructure logs">
      <p>The site uses Vercel Web Analytics to measure page views and understand aggregate traffic. According to <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">Vercel’s Analytics privacy documentation</a>, Web Analytics does not use third-party cookies, records anonymous data points, and uses a request-derived visitor hash that is discarded after 24 hours.</p>
      <p>Analytics data may include timestamp, route or URL, referrer, filtered query information, approximate geolocation, device type, operating system, and browser. It is not intended to identify a visitor or reconstruct browsing across unrelated sites. No custom analytics event currently asks for contact-form content, email addresses, or keytest input.</p>
      <p>Vercel, Cloudflare, and other infrastructure providers may separately process IP addresses, request headers, errors, and security logs to deliver the site, prevent abuse, and diagnose failures under their own terms.</p>
    </PolicySection>

    <PolicySection id="cookies" number="05" title="Cookies and local browser storage">
      <p>Essential HTTP-only cookies may be used for sign-in sessions and OAuth security state. The cookie banner saves <strong>avrxt_cookie_choice</strong> in local storage so it does not appear on every visit. The current “Accept” and “Essential only” buttons record that preference; this build does not install an advertising cookie.</p>
      <p>Vercel Web Analytics is cookieless and is not controlled by the cookie preference. Third-party embeds or connected services may use their own storage after you open or activate those features. Blocking cookies or local storage may prevent sign-in or preference persistence.</p>
      <PolicyCallout title="Browser controls">You can remove local storage and cookies through your browser. Clearing the stored choice causes the banner to appear again.</PolicyCallout>
    </PolicySection>

    <PolicySection id="providers" number="06" title="Service providers and international processing">
      <p>Providers are used only where needed to host the site or deliver requested features. They currently include Vercel, Cloudflare, Supabase, Resend, Gmail/Google, GitHub, Discord, Spotify, ipwho.is, RDAP operators, DummyJSON, and Google Fonts.</p>
      <p>These providers may process information in countries where they or their subprocessors operate. Their privacy notices, retention periods, and legal safeguards apply to their processing. Links to third-party sites are not controlled by AVRXT.</p>
    </PolicySection>

    <PolicySection id="retention" number="07" title="Purposes, disclosure, and retention">
      <p>Information is used to deliver requested features, respond to inquiries, maintain subscriptions, establish sessions, operate integrations, prevent abuse, measure aggregate traffic, and meet legal obligations. AVRXT does not sell personal information or provide it to an advertising network for targeted advertising.</p>
      <p>Information is kept only as long as needed for the feature, support, security, opt-out record, project relationship, or legal obligation. Contact messages may remain in the receiving mailbox; newsletter services may keep subscription or suppression records; infrastructure providers keep logs under their own schedules. The application does not promise one universal deletion period for every provider.</p>
    </PolicySection>

    <PolicySection id="rights" number="08" title="Your choices and privacy requests">
      <p>You can unsubscribe using the link in a newsletter. You may email AVRXT to request access to, correction of, or deletion of information you submitted. Enough information may be requested to verify the request and locate the relevant record.</p>
      <p>Some records may be retained where needed to honor an opt-out, protect the service, resolve a dispute, or comply with law. Depending on where you live, additional objection, restriction, portability, complaint, or consent-withdrawal rights may apply.</p>
    </PolicySection>

    <PolicySection id="security" number="09" title="Security, children, and policy changes">
      <p>Technical and organizational safeguards are used in proportion to the site’s features, but no transmission or storage system can be guaranteed completely secure. Please report suspected vulnerabilities through the <Link href="/security">Security page</Link>.</p>
      <p>The public site is not designed to knowingly collect information from children below the minimum age required by applicable law. This policy may be updated as features or providers change; the date above identifies the current version.</p>
    </PolicySection>
  </PolicyShell>;
}
