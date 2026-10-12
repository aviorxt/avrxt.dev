import DiscordLegalPage from '@/components/DiscordLegalPage';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Discord App Privacy Policy',
  description: 'Privacy policy for the AVRXT Discord bot application and Discord OAuth authentication.',
  keywords: ['AVRXT Discord bot privacy', 'Discord OAuth privacy policy', 'Discord application data'],
  path: '/dc/privacy',
});

export default function DiscordPrivacyPage() {
  return (
    <DiscordLegalPage
      label="// Discord Application / Privacy"
      title="Privacy Policy_"
      summary="This policy explains how the AVRXT Discord application and its authentication service collect, use, store, and protect Discord-related data. It applies when you authorize the application, use its bot features, or access protected AVRXT services with Discord."
      counterpartHref="/dc/terms"
      counterpartLabel="Discord App Terms"
      sections={[
        {
          title: 'Data We Collect',
          content: <>
            <p>Depending on the feature you use, we may receive <strong>your Discord user ID, username, display name, avatar, email address, OAuth authorization data, server membership, and assigned role IDs</strong>. When you interact with bot commands, we may also process the command, server ID, channel ID, interaction ID, and the response required to provide that command.</p>
            <p>We do not ask for or collect your Discord password. Discord credentials are entered only on Discord&apos;s authorization pages.</p>
          </>,
        },
        {
          title: 'How We Use Data',
          content: <ul>
            <li>Authenticate you and maintain a secure session.</li>
            <li>Confirm server membership or required roles before granting protected admin access.</li>
            <li>Operate requested bot commands and application features.</li>
            <li>Prevent abuse, investigate errors, and protect the application and its users.</li>
            <li>Comply with law, Discord&apos;s rules, and valid security requests.</li>
          </ul>,
        },
        {
          title: 'OAuth, Cookies & Storage',
          content: <>
            <p>Discord authentication is handled by our self-hosted <strong>OpenAuth</strong> service. It uses essential, HTTP-only cookies and short-lived authorization records to complete OAuth and maintain your session. Authentication records are stored in Cloudflare Workers KV. The public website runs on Vercel.</p>
            <p>Discord OAuth requests the identify scope; the current sign-in flow does not request your email. New authentication records retain only your user ID, provider, and admin-authorization result alongside the short-lived protocol data needed for authorization and session refresh. Your profile name, avatar URL, and email are not stored in new authentication records. Server membership and current roles are checked with the bot on the server; its token is not exposed to your browser. Restricted admin access requires the configured server role or explicit owner authorization. Permission failures and provider outages do not prove that a role is missing, and verification failures do not grant access.</p>
          </>,
        },
        {
          title: 'Sharing & Third Parties',
          content: <>
            <p>We do not sell Discord API data, use it for targeted advertising, provide it to data brokers, or use message content to train AI models. Data is shared only with service providers necessary to operate the application, including <strong>Discord, Cloudflare, and Vercel</strong>, or when required by law.</p>
            <p>Those services process information under their own terms and privacy policies. Discord&apos;s privacy policy is available at <a href="https://discord.com/privacy" target="_blank" rel="noreferrer">discord.com/privacy</a>.</p>
          </>,
        },
        {
          title: 'Retention & Deletion',
          content: <>
            <p>The website’s OAuth transaction cookie expires after 10 minutes. OpenAuth access tokens are short-lived; authentication cookies and refresh sessions have a 30-day maximum age and can renew with use. Authentication records are handled through Cloudflare Workers KV. Provider security logs follow their own retention schedules; we do not promise a universal 30-day log-deletion deadline. Bot interaction data is retained when needed for a requested feature or security investigation.</p>
            <p>Authorization codes and refresh records use automatic storage expiry. Daily maintenance minimizes legacy session records, removes provably expired records, and retires redundant signing or encryption keys after a safety period that protects existing sessions. This is session storage, not a retained login-history database; provider infrastructure may still process ordinary operational logs.</p>
            <p>You may revoke access through Discord&apos;s Authorized Apps settings at any time. To request access, correction, or deletion, email <a href="mailto:connect@elvnx.org">connect@elvnx.org</a> with your Discord user ID. After identity verification, we will act promptly and ordinarily complete deletion within 30 days, except where retention is legally required.</p>
          </>,
        },
        {
          title: 'Security',
          content: <p>We use encrypted transport, restricted server-side secrets, HTTP-only cookies, role-based access checks, and limited-access infrastructure. No online service can guarantee absolute security; please report suspected vulnerabilities to <a href="mailto:connect@elvnx.org">connect@elvnx.org</a>.</p>,
        },
        {
          title: 'Children & International Processing',
          content: <p>The application is not directed to anyone under 13 or below the minimum digital-consent age in their jurisdiction. Data may be processed in countries where Discord, Cloudflare, Vercel, or our other infrastructure providers operate, subject to applicable safeguards.</p>,
        },
        {
          title: 'Changes & Contact',
          content: <p>We may update this policy when the application, law, or Discord requirements change. The effective date above identifies the current version. Questions, privacy requests, and application-related reports can be sent to <a href="mailto:connect@elvnx.org">connect@elvnx.org</a>.</p>,
        },
      ]}
    />
  );
}
