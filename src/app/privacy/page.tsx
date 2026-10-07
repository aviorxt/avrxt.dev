import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
    title: 'Privacy Policy',
    description: 'How avrxt.dev handles information submitted through the website, account sign-in, and newsletter.',
    keywords: ['privacy policy', 'avrxt privacy', 'personal data', 'data requests'],
    path: '/privacy',
});

const lastUpdated = '7 October 2026';
const supportEmail = 'support@avrxt.dev';

function PolicySection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <section className="legal-section scroll-mt-24 border border-white/10 p-5 sm:p-7">
            <h2 className="mb-3 border-l-2 border-white/30 pl-3 font-mono text-xs font-bold uppercase tracking-[.16em] text-white sm:text-sm sm:tracking-[.22em]">
                <span className="mr-2 text-zinc-500">{number}</span>{title}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-zinc-400 [overflow-wrap:anywhere]">{children}</div>
        </section>
    );
}

export default function Privacy() {
    return (
        <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
            <Reveal className="active">
                <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[.25em] text-zinc-500 sm:tracking-[.4em]">// Privacy / Data Use</p>
                    <h1 className="mb-5 text-[clamp(2.4rem,9vw,4.5rem)] font-black leading-[.95] tracking-[-.06em] text-white">Privacy Policy</h1>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
                        This page explains what information the avrxt.dev website receives, why it is used, and how to make a privacy request.
                    </p>
                    <p className="mt-5 font-mono text-[11px] text-zinc-600">Last updated: {lastUpdated}</p>
                </header>

                <div className="space-y-4 sm:space-y-5">
                    <PolicySection number="01" title="Who operates this site">
                        <p>avrxt.dev is operated by AVRXT. For questions or requests about information handled through this website, email <a className="break-all text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
                        <p>This notice describes the website as currently built. It is not a certification that the site complies with every privacy law. Applicable requirements depend on where you are and which services you use.</p>
                    </PolicySection>

                    <PolicySection number="02" title="Information you choose to provide">
                        <ul className="list-disc space-y-2 pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Contact and project inquiries:</strong> your name, email address, project selections, budget or timeline details, and message. The form sends these details to the site operator by email so they can respond.</li>
                            <li><strong className="text-zinc-200">Newsletter:</strong> your email address and subscription status are managed through Resend. Supabase stores your email, audience identifier, and a hash of the custom unsubscribe token so the link can be verified without storing the raw token.</li>
                            <li><strong className="text-zinc-200">Guestbook:</strong> if you sign in and post, the message, account identifier, display name, and avatar URL may be stored in Supabase and shown publicly. Guestbook text may be checked by an abuse-moderation service.</li>
                            <li><strong className="text-zinc-200">Sign-in:</strong> when you choose GitHub or Discord sign-in, the identity details those providers return are used to establish your session and apply access rules. Sign-in uses essential HTTP-only cookies.</li>
                        </ul>
                        <p>Please do not submit passwords, payment card details, government identifiers, health information, or other sensitive information in public fields or ordinary contact messages.</p>
                    </PolicySection>

                    <PolicySection number="03" title="Information processed when you browse">
                        <p>Our hosting, edge, storage, authentication, and security providers may process technical request data such as IP address, browser and device details, requested URL, and request time to deliver the site, prevent abuse, and diagnose failures. Rate-limit checks may use a platform-provided network address in short-lived server memory.</p>
                        <p>The application code does not include an advertising tracker or a behavioral analytics script. Hosting and security providers may still create their own operational logs under their policies.</p>
                    </PolicySection>

                    <PolicySection number="04" title="Features and third-party services">
                        <p>The site uses service providers to run requested features. These currently include Vercel for web hosting, Cloudflare for edge services, media delivery, and the newsletter unsubscribe Worker, Supabase for application data, Resend for newsletter delivery, and Gmail for contact and project inquiry delivery. Authentication can involve GitHub, Discord, and the OpenAuth service.</p>
                        <p>Optional profile features may request data from Spotify, Discord/Lanyard, YouTube, and Open-Meteo for music, presence, embeds, or weather. These requests may reveal technical connection information to the service involved. Third-party sites and services have their own privacy terms and controls.</p>
                    </PolicySection>

                    <PolicySection number="05" title="Cookies and similar storage">
                        <p>Essential cookies are used for sign-in sessions and OAuth security state. They support features you request and are not used by this application for ad targeting. If you block cookies, sign-in and connected-account features may not work.</p>
                    </PolicySection>

                    <PolicySection number="06" title="Use, sharing, and retention">
                        <p>Information is used to respond to inquiries, provide account and guestbook features, send requested newsletter emails, operate profile integrations, and protect the site. We do not sell personal information or share it with advertising networks for targeted advertising.</p>
                        <p>Information is kept for as long as needed for the relevant feature, support, security, or legal obligations. Inquiry emails may remain in the recipient's mailbox; newsletter providers may retain subscription or suppression records so that opt-outs are respected. Infrastructure providers may retain their own logs under their terms. The codebase does not define a universal 30-day deletion period.</p>
                        <p>Providers may process information in the countries where their systems operate. Their safeguards and retention practices are governed by their terms and applicable law.</p>
                    </PolicySection>

                    <PolicySection number="07" title="Your choices and requests">
                        <p>You can unsubscribe using the link in a newsletter. You can also email us to request access to, correction of, or deletion of information you submitted. We may ask for enough information to verify the request and may retain limited records where required to honor an opt-out, protect the site, or meet a legal obligation.</p>
                        <p>Where data-protection laws apply, additional rights and response requirements may be available. India's Digital Personal Data Protection Act and Rules have phased commencement; this notice does not claim a blanket compliance status. See the <a className="text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href="https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025" target="_blank" rel="noreferrer">official DPDP Rules publication</a> for the current text.</p>
                    </PolicySection>

                    <PolicySection number="08" title="Security and policy changes">
                        <p>We use access controls and technical safeguards appropriate to the services we operate, but no internet transmission or storage system can be guaranteed completely secure. If this policy changes, the updated version and date will appear here.</p>
                        <p>See also our <Link className="text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href="/terms">Terms of Use</Link>.</p>
                    </PolicySection>
                </div>
            </Reveal>
        </main>
    );
}
