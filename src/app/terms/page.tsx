import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
    title: 'Terms of Use',
    description: 'Terms for using avrxt.dev, its public content, account features, and APIs.',
    keywords: ['terms of use', 'avrxt terms', 'website use', 'API terms'],
    path: '/terms',
});

const lastUpdated = '7 October 2026';
const supportEmail = 'support@avrxt.dev';

function TermsSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <section className="legal-section scroll-mt-24 border border-white/10 p-5 sm:p-7">
            <h2 className="mb-3 border-l-2 border-white/30 pl-3 font-mono text-xs font-bold uppercase tracking-[.16em] text-white sm:text-sm sm:tracking-[.22em]">
                <span className="mr-2 text-zinc-500">{number}</span>{title}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-zinc-400 [overflow-wrap:anywhere]">{children}</div>
        </section>
    );
}

export default function Terms() {
    return (
        <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
            <Reveal className="active">
                <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[.25em] text-zinc-500 sm:tracking-[.4em]">// Website / Terms</p>
                    <h1 className="mb-5 text-[clamp(2.4rem,9vw,4.5rem)] font-black leading-[.95] tracking-[-.06em] text-white">Terms of Use</h1>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
                        These terms cover your use of avrxt.dev, including its public pages, forms, community features, and APIs.
                    </p>
                    <p className="mt-5 font-mono text-[11px] text-zinc-600">Last updated: {lastUpdated}</p>
                </header>

                <div className="space-y-4 sm:space-y-5">
                    <TermsSection number="01" title="Using the site">
                        <p>By accessing or using avrxt.dev, you agree to these terms and the applicable laws where you use the site. If you do not agree, do not use the site. These terms apply to the public website and its interactive features; separate terms may apply to third-party services.</p>
                        <p>The site and its features may change, be unavailable, or be discontinued. We do not promise uninterrupted operation or a particular response time.</p>
                    </TermsSection>

                    <TermsSection number="02" title="Accounts and connected services">
                        <p>Some features require sign-in through GitHub or Discord. Use an account you control, provide accurate information to the provider, and do not attempt to bypass access checks. The providers' own terms apply to your use of their services.</p>
                        <p>You are responsible for activity performed through your account and for keeping your sign-in methods secure. Contact us if you believe an account or session has been misused.</p>
                    </TermsSection>

                    <TermsSection number="03" title="Guestbook and submitted content">
                        <p>You retain any rights you have in content you submit. When you post to a public feature such as the guestbook, you give AVRXT a non-exclusive, worldwide, royalty-free permission to host, display, format, moderate, and remove that content as needed to operate the feature. Public posts may be visible to anyone and may be copied by other visitors.</p>
                        <p>Only submit content you have the right to share. Do not post private information, unlawful material, threats, harassment, spam, malware, or content that infringes another person's rights. We may edit or remove content and restrict access when reasonably needed to protect users, the site, or the service.</p>
                    </TermsSection>

                    <TermsSection number="04" title="Acceptable use and APIs">
                        <p>Do not use the site to break the law, interfere with another person's use, probe or bypass security without authorization, overload services, distribute malware, or send spam. Automated access must respect published limits and must not degrade the service or collect personal information unlawfully.</p>
                        <p>APIs and integrations may have rate limits, change without notice, or depend on third-party providers. Do not treat their output as guaranteed, complete, or suitable for safety-critical decisions.</p>
                    </TermsSection>

                    <TermsSection number="05" title="Ownership and open-source software">
                        <p>Names, logos, photographs, video, writing, and third-party materials remain owned by their respective rights holders. These terms do not grant permission to use them beyond what law allows.</p>
                        <p>Where source code is published in the avrxt-in-1 repository, that code is licensed under the license included in that repository. The repository license does not automatically cover this site's brand, media, or third-party assets.</p>
                    </TermsSection>

                    <TermsSection number="06" title="Third-party services and links">
                        <p>The site may link to or rely on services operated by others, including hosting, storage, authentication, email, music, and social platforms. We do not control their availability, content, or policies. Your use of those services is governed by their own terms and privacy notices.</p>
                    </TermsSection>

                    <TermsSection number="07" title="Disclaimers and liability">
                        <p>The site is provided on an “as available” basis. To the extent permitted by applicable law, AVRXT disclaims implied warranties and is not responsible for indirect or consequential loss, loss of data, or interruptions caused by third-party services or events outside reasonable control.</p>
                        <p>Nothing in these terms excludes or limits liability that cannot legally be excluded or limited. Where liability may be limited, it is limited only to the extent permitted by applicable law.</p>
                    </TermsSection>

                    <TermsSection number="08" title="Changes, law, and contact">
                        <p>We may update these terms by publishing a revised version here. The updated date indicates when the current text was posted. Continued use after an update means you accept the revised terms to the extent permitted by law.</p>
                        <p>These terms are governed by the laws of India, subject to any mandatory consumer or other legal protections that apply to you. Disputes may be brought before a court with jurisdiction under applicable law.</p>
                        <p>Questions about these terms: <a className="break-all text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href={`mailto:${supportEmail}`}>{supportEmail}</a>. See also our <Link className="text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href="/privacy">Privacy Policy</Link> and <Link className="text-zinc-200 underline decoration-white/20 underline-offset-4 hover:decoration-white" href="/refund">Refund Policy</Link>.</p>
                    </TermsSection>
                </div>
            </Reveal>
        </main>
    );
}
