import Link from 'next/link';
import { PolicyCallout, PolicyList, PolicySection, PolicyShell } from '@/components/legal/PolicyShell';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Terms of Use',
  description: 'Terms for using avrxt.dev, its public tools, forms, account features, integrations, content, and APIs.',
  keywords: ['terms of use', 'avrxt terms', 'acceptable use', 'developer tools', 'API terms'],
  path: '/terms',
});

const nav = [
  { id: 'agreement', label: 'Agreement and scope' }, { id: 'tools', label: 'Public tools' }, { id: 'acceptable', label: 'Acceptable use' }, { id: 'accounts', label: 'Accounts' }, { id: 'submissions', label: 'Your submissions' }, { id: 'ownership', label: 'Ownership' }, { id: 'services', label: 'Third parties' }, { id: 'paid', label: 'Paid work' }, { id: 'liability', label: 'Disclaimers' }, { id: 'changes', label: 'Changes and contact' },
];

export default function TermsPage() {
  return <PolicyShell eyebrow="Website agreement" title="Terms of use" description="Rules for using avrxt.dev and its tools responsibly. Separate written terms may apply when AVRXT provides paid project work." version="v3.0" lastUpdated="8 October 2026" nav={nav} highlights={[{ label: 'Public tools', value: 'Informational outputs' }, { label: 'Port testing', value: 'Authorization required' }, { label: 'Paid projects', value: 'Separate scope may apply' }]}>
    <PolicySection id="agreement" number="01" title="Agreement and scope">
      <p>By accessing or using avrxt.dev, you agree to these terms and to applicable law. If you do not agree, do not use the site. These terms cover public pages, forms, tools, APIs, account features, and integrations operated through this website.</p>
      <p>The site may change, experience downtime, or discontinue a feature. No promise is made that every feature will remain available, error-free, or compatible with every device.</p>
    </PolicySection>

    <PolicySection id="tools" number="02" title="Public tools and result accuracy">
      <p>IP, DNS, RDAP, port, email-domain, font, Spotify, quote, and keyboard tools are provided for convenience and general information. Outputs may be incomplete, delayed, approximate, provider-dependent, or affected by VPNs, proxies, DNS caching, network filtering, browser restrictions, and third-party outages.</p>
      <PolicyList items={[
        'Do not rely on a tool result as the only basis for a legal, medical, financial, safety-critical, or production-security decision.',
        'Mailfy verifies syntax and domain mail routing; it does not confirm that a mailbox exists or belongs to a person.',
        'IP geolocation is approximate and may identify a provider gateway rather than a physical location.',
        'The keyboard tester runs in the browser, but operating-system and browser shortcuts may be intercepted before the page receives them.',
      ]} />
    </PolicySection>

    <PolicySection id="acceptable" number="03" title="Acceptable use and testing authorization">
      <p>You must not use the site to violate law, invade privacy, infringe intellectual property, distribute malware, send spam, overload infrastructure, evade access controls, scrape protected data, or interfere with another person’s use.</p>
      <p>Use the port checker only against a public system you own or are expressly authorized to test. Do not attempt to bypass private-address protections, rate limits, request limits, or other safeguards. Automated access must remain reasonable and must stop if it affects service stability.</p>
      <p>The Spotify feature uses the official player. It does not grant permission to download, extract, convert, circumvent protection, or redistribute audio.</p>
    </PolicySection>

    <PolicySection id="accounts" number="04" title="Accounts and connected services">
      <p>Some features may require GitHub or Discord sign-in or a connection to Spotify. Use only accounts you control, follow each provider’s terms, and do not bypass authorization or role checks.</p>
      <p>You are responsible for securing your provider account and device. Notify AVRXT if you reasonably believe a session or connected feature has been misused. Access may be restricted to protect the site or investigate abuse.</p>
    </PolicySection>

    <PolicySection id="submissions" number="05" title="Contact messages and other submissions">
      <p>You retain rights you already have in content you submit. You give AVRXT permission to process that content as reasonably needed to respond, provide requested services, operate the feature, protect the site, and meet legal obligations.</p>
      <p>Submit only content you have the right to share. Do not submit secrets, passwords, one-time codes, full card data, unlawful content, threats, malware, or another person’s confidential information without authorization.</p>
    </PolicySection>

    <PolicySection id="ownership" number="06" title="Site content, brand, and open source">
      <p>The avrxt name, site design, original writing, photographs, video, and other original materials remain protected by applicable intellectual-property law. Third-party names, media, fonts, embeds, and software remain owned by their respective rights holders.</p>
      <p>Source code published in the avrxt-in-1 repository is governed by the license included with that repository. A source-code license does not automatically grant rights to the AVRXT brand, private credentials, personal media, or third-party assets.</p>
    </PolicySection>

    <PolicySection id="services" number="07" title="Third-party services and links">
      <p>The site relies on or links to providers for hosting, analytics, DNS, identity, storage, email, fonts, media, music, network data, and quotes. Their availability, accuracy, policies, and acts are outside AVRXT’s direct control. Your use of a provider is also governed by that provider’s terms.</p>
      <p>The Ask AI launcher prepares page context and your question for a third-party AI service that you choose. AVRXT does not operate those models, control their responses, or guarantee that an answer is accurate or complete. Review important answers independently, and do not put passwords, confidential material, or sensitive personal data in an AI prompt.</p>
      <p>Links do not imply endorsement, and AVRXT is not responsible for content or transactions on an external website.</p>
    </PolicySection>

    <PolicySection id="paid" number="08" title="Paid project work and refunds">
      <p>Public tool access does not create a consulting relationship. Paid work begins only when the parties agree to a proposal, invoice, statement of work, or another clear arrangement. That document may define scope, milestones, revisions, ownership, warranties, payment timing, and cancellation terms.</p>
      <p>The <Link href="/refund">Refund Policy</Link> applies to eligible direct payments unless project-specific written terms say otherwise.</p>
    </PolicySection>

    <PolicySection id="liability" number="09" title="Disclaimers and limits">
      <p>The site is provided on an “as available” basis. To the extent permitted by law, AVRXT disclaims implied warranties and is not responsible for indirect, incidental, special, or consequential loss arising from tool output, downtime, data loss, third-party conduct, or use outside the documented purpose.</p>
      <p>Nothing here excludes liability or a legal remedy that cannot be excluded. If a limitation is not enforceable where you live, it applies only to the maximum extent allowed there.</p>
      <PolicyCallout title="Use professional judgment">You remain responsible for validating results, maintaining backups, securing credentials, and obtaining permission before testing a system.</PolicyCallout>
    </PolicySection>

    <PolicySection id="changes" number="10" title="Changes, governing law, and contact">
      <p>These terms may be updated by publishing a revised version here. Continued use after an update constitutes acceptance to the extent permitted by law. Material paid-project rights are not retroactively changed where a separate written agreement controls.</p>
      <p>These terms are governed by the laws of India, subject to mandatory consumer or other protections that apply to you. A dispute may be brought before a court that has jurisdiction under applicable law.</p>
      <p>Questions can be sent to <a href="mailto:support@avrxt.dev">support@avrxt.dev</a>. Information about data handling appears in the <Link href="/privacy">Privacy Policy</Link>, and vulnerability reports belong on the <Link href="/security">Security page</Link>.</p>
    </PolicySection>
  </PolicyShell>;
}
