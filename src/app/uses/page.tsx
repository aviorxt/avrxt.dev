import Reveal from '@/components/Reveal';
import { buildPageMetadata } from '@/lib/page-metadata';
import { ArrowUpRight, BookOpen, Bot, Boxes, Code2, Command, Layers3 } from 'lucide-react';

const sections = [
    {
        title: 'Coding',
        items: [
            {
                name: 'VSCode',
                description: 'After using Sublime for many years, I moved to VSCode like everybody else.',
                url: 'https://code.visualstudio.com/',
            },
        ],
    },
    {
        title: 'Terminal',
        items: [
            {
                name: 'Hyper',
                description: "Performance could be better, but I enjoy using this since it's made with JavaScript.",
                url: 'https://hyper.is/',
            },
        ],
    },
    {
        title: 'Apps',
        items: [
            {
                name: 'Bartender',
                description: 'Perfect way to declutter and manage the macOS menubar.',
                url: 'https://www.macbartender.com/',
            },
            {
                name: 'Figma',
                description: 'I never thought something would replace the Adobe suite for me. Figma did.',
                url: 'https://www.figma.com/',
            },
            {
                name: 'Things',
                description: 'My current choice for to-do lists and organizing personal tasks.',
                url: 'https://culturedcode.com/things/',
            },
            {
                name: 'Divvy',
                description: 'Tiny app that I use to create custom window positions.',
                url: 'https://mizage.com/divvy/',
            },
            {
                name: 'Zoho Mail',
                description: 'Primary inbox for business mail and custom domains.',
                url: 'https://www.zoho.com/mail/',
            },
            {
                name: 'Spotify',
                description: 'Daily streaming for focus, momentum, and long work sessions.',
                url: 'https://www.spotify.com/',
            },
            {
                name: 'Proton Mail',
                description: 'Secure email for privacy-first communication.',
                url: 'https://proton.me/mail',
            },
            {
                name: 'Proton Pass',
                description: 'Password manager for secure vaults across devices.',
                url: 'https://proton.me/pass',
            },
            {
                name: 'Proton Authenticator',
                description: 'Two-factor codes that stay synced and protected.',
                url: 'https://proton.me/authenticator',
            },
        ],
    },
    {
        title: 'Services',
        items: [
            {
                name: 'Algolia',
                description: 'My first choice when adding search capabilities to any project.',
                url: 'https://www.algolia.com/',
            },
            {
                name: 'Cloudflare',
                description: 'The DNS service I use with all my domains. Amazing product.',
                url: 'https://www.cloudflare.com/',
            },
            {
                name: 'AWS S3',
                description: 'Object storage for assets, backups, and long-term files.',
                url: 'https://aws.amazon.com/s3/',
            },
            {
                name: 'AWS EC2',
                description: 'Flexible compute for custom workloads and long-running services.',
                url: 'https://aws.amazon.com/ec2/',
            },
            {
                name: 'AWS Route 53',
                description: 'Domain management and routing when I need AWS-native DNS.',
                url: 'https://aws.amazon.com/route53/',
            },
            {
                name: 'AWS DynamoDB',
                description: 'Managed NoSQL storage for low-latency workloads.',
                url: 'https://aws.amazon.com/dynamodb/',
            },
            {
                name: 'AWS Amplify',
                description: 'Quick web app hosting with CI/CD and previews.',
                url: 'https://aws.amazon.com/amplify/',
            },
            {
                name: 'AWS CloudFront',
                description: 'CDN acceleration for global asset delivery.',
                url: 'https://aws.amazon.com/cloudfront/',
            },
            {
                name: 'Self-hosted DNS management (VPS)',
                description: 'Running my own DNS stack on a VPS for full control.',
                url: 'https://coredns.io/',
            },
            {
                name: 'Self-hosted Supabase',
                description: 'Self-hosted for flexibility and control over data.',
                url: 'https://supabase.com/docs/guides/self-hosting',
            },
            {
                name: 'Resend',
                description: 'The new email API for developers.',
                url: 'https://resend.com/',
            },
            {
                name: 'Vercel',
                description: 'Here is where I host all my websites. By far the best developer experience.',
                url: 'https://vercel.com/',
            },
            {
                name: 'Render.com',
                description: 'Extra compute for services I do not want on Vercel.',
                url: 'https://render.com/',
            },
        ],
    },
    {
        title: 'Reading',
        items: [
            {
                name: 'Audible',
                description: 'The perfect choice to listen to a book while running outside.',
                url: 'https://www.audible.com/',
            },
        ],
    },
    {
        title: 'AI Tools',
        items: [
            {
                name: 'OpenAI Codex',
                description: 'For fixes and planning.',
                url: 'https://openai.com/codex',
            },
            {
                name: 'Google Antigravity',
                description: 'For development assistance.',
                url: 'https://antigravity.google/',
            },
            {
                name: 'Claude',
                description: 'For analyzing and troubleshooting.',
                url: 'https://claude.ai/',
            },
        ],
    },
];

export const metadata = buildPageMetadata({
    title: 'Uses — avrxt’s Software, Services and Workflow',
    description: "The software, services, AI tools, and infrastructure behind avrxt's development workflow.",
    keywords: ['avrxt uses', 'developer tools', 'software stack', 'AI tools', 'web development workflow', 'cloud infrastructure'],
    path: '/uses',
});

const sectionIcons = [Code2, Command, Layers3, Boxes, BookOpen, Bot];

export default function UsesPage() {
    return (
        <main className="uses-page relative min-h-screen overflow-x-clip bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36">
            <div className="uses-ambient pointer-events-none absolute inset-x-0 top-0 h-[44rem]" />
            <div className="relative mx-auto max-w-6xl">
                <Reveal className="border-b border-[#1F1F1F] pb-14 sm:pb-20">
                    <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[.22em] text-[#858585]">
                        <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,.5)]" /> Workflow inventory</span>
                        <span>Continuously updated / {sections.length} categories</span>
                    </div>
                    <div className="mt-9 grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
                        <div>
                            <p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#686868]">/uses — system manifest</p>
                            <h1 className="mt-5 font-outfit text-[clamp(4rem,12vw,9rem)] font-semibold uppercase leading-[.76] tracking-[-.08em]">Tools for{' '}<br /><span className="uses-outline">the work.</span></h1>
                        </div>
                        <p className="max-w-xl border-l border-[#333333] pl-5 text-sm leading-7 text-[#A3A3A3] sm:text-base sm:leading-8">A living inventory of the software, services, and infrastructure in my day-to-day workflow. Each choice earns its place by making the work faster, clearer, or more dependable.</p>
                    </div>
                    <nav aria-label="Uses categories" className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {sections.map((section, index) => <a key={section.title} href={`#uses-${index + 1}`} className="shrink-0 border border-[#292929] bg-[#080808] px-3 py-2 font-mono text-[8px] uppercase tracking-[.16em] text-[#A3A3A3] transition-colors hover:border-[#686868] hover:text-white">{String(index + 1).padStart(2, '0')} / {section.title}</a>)}
                    </nav>
                </Reveal>

                <div className="mt-12 grid gap-4 lg:grid-cols-2">
                    {sections.map((section, sectionIndex) => {
                        const Icon = sectionIcons[sectionIndex];
                        return (
                            <Reveal key={section.title} id={`uses-${sectionIndex + 1}`} delay={Math.min(sectionIndex * 0.05, 0.2)} className={`uses-panel scroll-mt-28 border border-[#1F1F1F] bg-[#080808] ${sectionIndex === 3 ? 'lg:row-span-2' : ''}`}>
                                <header className="flex items-center justify-between border-b border-[#1F1F1F] p-5 sm:p-6">
                                    <div className="flex items-center gap-4"><span className="grid size-10 place-items-center border border-[#292929] bg-black text-[#D0D0D0]"><Icon size={17} /></span><div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">Category / {String(sectionIndex + 1).padStart(2, '0')}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{section.title}</h2></div></div>
                                    <span className="font-mono text-[9px] text-[#666666]">{String(section.items.length).padStart(2, '0')} items</span>
                                </header>
                                <div className="divide-y divide-[#1F1F1F]">
                                    {section.items.map((item, itemIndex) => (
                                        <article key={`${section.title}-${item.name}`} className="uses-item group grid grid-cols-[2rem_1fr_auto] gap-3 p-5 transition-colors hover:bg-white/[.025] sm:gap-4 sm:px-6">
                                            <span className="pt-0.5 font-mono text-[8px] tracking-[.16em] text-[#484848]">{String(itemIndex + 1).padStart(2, '0')}</span>
                                            <div className="min-w-0">
                                                {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-[#F7F7F7] transition-colors group-hover:text-white">{item.name}</a> : <p className="font-medium text-[#F7F7F7]">{item.name}</p>}
                                                {item.description && <p className="mt-1.5 text-xs leading-6 text-[#858585] sm:text-sm">{item.description}</p>}
                                            </div>
                                            {item.url && <ArrowUpRight aria-hidden="true" size={13} className="mt-1 text-[#484848] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />}
                                        </article>
                                    ))}
                                </div>
                            </Reveal>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-col gap-6 border border-[#1F1F1F] bg-black p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div><p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#666666]">End of manifest</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#A3A3A3]">The stack changes when a better tool earns the switch. This page reflects the current working setup, not permanent endorsements.</p></div>
                    <a href="https://www.instagram.com/aviorxt/" target="_blank" rel="noreferrer" className="group inline-flex min-h-11 w-fit shrink-0 items-center gap-3 border border-[#292929] px-4 font-mono text-[8px] uppercase tracking-[.16em] text-[#D0D0D0] transition-colors hover:border-[#666666] hover:text-white">Follow @aviorxt <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                </div>
            </div>
        </main>
    );
}
