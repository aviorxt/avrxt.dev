import Link from 'next/link';
import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Ownership & Independence Notice',
  description: 'AVRXT.DEV is a personal website independently operated and maintained by an individual, not a company or separate legal entity.',
  keywords: ['avrxt ownership', 'avrxt.dev independent website', 'aviorxt', 'personal website', 'independence notice'],
  path: '/annon/ownership',
});

const nav = [
  { id: 'status', label: 'Website status' },
  { id: 'operator', label: 'Operation' },
  { id: 'identity', label: 'Names and identity' },
  { id: 'affiliations', label: 'No affiliation' },
  { id: 'services', label: 'Projects and services' },
  { id: 'contact', label: 'Contact' },
];

export default function OwnershipPage() {
  return (
    <PolicyShell
      eyebrow="Public notice"
      title="Ownership & independence"
      description="A plain-language notice about who operates AVRXT.DEV and what the website represents."
      version="v1.0"
      lastUpdated="8 October 2026"
      nav={nav}
      highlights={[
        { label: 'Website type', value: 'Personal website' },
        { label: 'Operator', value: 'One individual' },
        { label: 'Corporate status', value: 'Not a company' },
      ]}
    >
      <PolicySection id="status" number="01" title="Status of AVRXT.DEV">
        <p>AVRXT.DEV is a personal, independently operated website. It is not a company, corporation, partnership, registered organization, or separate legal entity.</p>
        <p>The website is a personal publishing and development project used to present work, technical writing, public utilities, music information, contact options, and other independently created features.</p>
        <PolicyCallout title="Independent personal project">References to “AVRXT,” “avrxt.dev,” “we,” or “the site” describe this website and its individual operator. They do not imply that a company, staff, or incorporated organization exists.</PolicyCallout>
      </PolicySection>

      <PolicySection id="operator" number="02" title="Operation and maintenance">
        <p>AVRXT.DEV is run, maintained, designed, and developed by an individual based in India. The operator may use third-party hosting, infrastructure, email, analytics, identity, music, and API providers to make the website work, but those providers do not own or operate AVRXT.DEV.</p>
        <p>Features may be changed, paused, or discontinued as part of maintaining a personal project. References to product, engineering, security, support, or administration describe functions performed for the site and are not claims that separate business departments exist.</p>
      </PolicySection>

      <PolicySection id="identity" number="03" title="Names, aliases, and online identity">
        <p>“avrxt” and “aviorxt” are online names used by the individual operator. “AVRXT.DEV” identifies this website and its digital presence; it should not be interpreted as the legal name of a company or separate organization.</p>
        <p>Copyright notices, branding, social profiles, repository names, and email addresses using AVRXT or aviorxt identify the operator’s work or online presence. They do not create a separate legal personality.</p>
      </PolicySection>

      <PolicySection id="affiliations" number="04" title="No implied company or platform affiliation">
        <p>AVRXT.DEV is not owned, sponsored, endorsed, or operated by the third-party platforms and brands referenced through its features unless a page expressly says otherwise.</p>
        <PolicyList items={[
          'GitHub, Discord, Spotify, Google, Vercel, Cloudflare, Supabase, Resend, OpenAI, Gemini, Claude, Grok, and other names belong to their respective owners.',
          'Using a third-party API, embed, sign-in provider, font, logo, or external link does not create a partnership, agency, employment, or endorsement relationship.',
          'Aircraft-related experience or content does not make AVRXT.DEV an airline, maintenance organization, aviation authority, or aircraft manufacturer.',
        ]} />
      </PolicySection>

      <PolicySection id="services" number="05" title="Projects, payments, and individual responsibility">
        <p>Browsing the website, using its free tools, joining the newsletter, viewing Muzix, or using Ask AI does not create a client, employment, partnership, or advisory relationship.</p>
        <p>If paid project work is separately agreed, the contracting party is the individual identified in the applicable proposal, invoice, or written agreement—not a separate AVRXT.DEV company. Project-specific documents may provide additional identity, scope, payment, ownership, cancellation, and dispute terms.</p>
        <p>Website use remains subject to the <Link href="/legal/terms">Terms of Use</Link>. Information handling is described in the <Link href="/legal/privacy">Privacy Policy</Link>, and eligible direct-payment requests are addressed by the <Link href="/legal/refund">Refund Policy</Link>.</p>
      </PolicySection>

      <PolicySection id="contact" number="06" title="Questions and verification">
        <p>Questions about this notice or the ownership of AVRXT.DEV can be sent to <a href="mailto:support@avrxt.dev">support@avrxt.dev</a>. Do not rely on an unrelated account, domain, or person claiming to represent AVRXT.DEV without verifying through an official link published on this website.</p>
        <p>This notice may be revised if the ownership or legal status of the website changes. The version and update date above identify the current notice.</p>
      </PolicySection>
    </PolicyShell>
  );
}
