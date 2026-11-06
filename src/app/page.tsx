import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { buildPageMetadata } from '@/lib/page-metadata';
import HomeSubscribe from '@/components/HomeSubscribe';
import HomeBloom from '@/components/HomeBloom';
import GardenMotion from '@/components/GardenMotion';
import GardenFooter from '@/components/GardenFooter';
import GardenWordmark from '@/components/GardenWordmark';
import { WorkshopObject, RecordObject, NotebookObject } from '@/components/GardenObjects';
import { getPublicProfileRecord } from '@/lib/public-data';
import { connection } from 'next/server';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site-identity';

export const metadata = buildPageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, keywords: ['avrxt', 'aviorxt', 'independent developer', 'aircraft maintenance engineer', 'India'], path: '/' });

export default async function HomePage() {
    await connection();
    const config = await getPublicProfileRecord().catch(() => null);
    const showNewsletter = config?.site?.newsletterEnabled !== false && config?.site?.newsletterShowHome !== false;
    return (
        <div className="garden-home" id="garden-top">
            <GardenMotion />
            <a href="#garden-explore" className="garden-skip">Skip to explore</a>
            <header className="garden-header">
                <Link href="/" aria-label="avrxt home" className="garden-brand"><GardenWordmark /></Link>
                <nav aria-label="Main navigation"><a href="#garden-explore">Explore</a><Link href="https://docs.avrxt.dev">Notes</Link><Link href="/contact" className="garden-contact">Say hello <ArrowUpRight size={14}/></Link></nav>
            </header>
            <section className="garden-hero" aria-labelledby="garden-title">
                <div className="garden-intro">
                    <p className="garden-eyebrow"><span className="garden-live-dot"/> Independent by design · India</p>
                    <h1 id="garden-title"><span>A little code.</span><span>A lot of <em>curiosity<svg viewBox="0 0 300 18" aria-hidden="true"><path d="M3 12 Q120 0 295 8 M85 16 Q175 8 265 13"/></svg>.</em></span></h1>
                    <p className="garden-intro-copy">I’m <strong>avrxt</strong>, an independent developer in India. I make web tools, keep technical notes, and usually have a song on repeat.</p>
                    <div className="garden-actions"><a href="#garden-explore" className="garden-primary">Step inside <ArrowDown size={16}/></a><Link href="/about" className="garden-text-link">The person behind it <ArrowUpRight size={15}/></Link></div>
                    <p className="garden-alias">AVIORXT / AVR.XT <span>CODE, CRAFT & EVERYTHING BETWEEN.</span></p>
                </div>
                <div className="garden-artwork"><HomeBloom /></div>
                <div className="garden-hero-foot"><span>01 — A digital garden</span><span>Move closer. The flowers respond.</span><a href="#garden-explore" aria-label="Scroll to explore"><ArrowDown size={16}/></a></div>
            </section>
            <section id="garden-explore" className="garden-explore" aria-labelledby="garden-explore-title">
                <div className="garden-section-heading"><div><p className="garden-eyebrow">02 / On my desk</p><h2 id="garden-explore-title">A few things<br/>I’m <em>working on.</em></h2></div><p>A toolbox, a listening journal,<br/>and a notebook that keeps growing.</p></div>
                <div className="garden-cards">
                    <Link href="/tools" className="garden-card garden-card-tools"><div className="garden-card-top"><span>01 / THE WORKSHOP</span><ArrowUpRight size={20}/></div><WorkshopObject /><h3>Small tools.<br/>Real usefulness.</h3><p>Utilities for the everyday details — DNS, fonts, mail, and more.</p><span className="garden-card-link">Open the toolbox <ArrowUpRight size={14}/></span></Link>
                    <Link href="https://muzix.avrxt.dev" className="garden-card garden-card-music"><div className="garden-card-top"><span>02 / MUZIX</span><ArrowUpRight size={20}/></div><RecordObject /><h3>Life has<br/>a soundtrack.</h3><p>A personal listening journal. The songs, artists, and repeat plays.</p><span className="garden-card-link">Find the rhythm <ArrowUpRight size={14}/></span></Link>
                    <Link href="https://docs.avrxt.dev" className="garden-card garden-card-notes"><div className="garden-card-top"><span>03 / FIELD NOTES</span><ArrowUpRight size={20}/></div><NotebookObject /><h3>Learning,<br/>out in the open.</h3><p>Technical notes, useful recipes, and things learned along the way.</p><span className="garden-card-link">Read the notebook <ArrowUpRight size={14}/></span></Link>
                </div>
            </section>
            <section className="garden-person" aria-labelledby="garden-person-title"><p className="garden-eyebrow">03 / Behind the screen</p><div><h2 id="garden-person-title">A person.<br/><em>A work in progress.</em></h2><p>I like making the web a little more useful, and a little more interesting. Web applications, APIs, small experiments — and notes about what I learn building them.</p><div className="garden-person-links"><Link href="https://me.avrxt.dev">Meet avrxt <ArrowUpRight size={15}/></Link><Link href="/guestbook">Leave a little hello <ArrowUpRight size={15}/></Link></div></div><span className="garden-person-flower" aria-hidden="true">✳</span></section>
            {showNewsletter && <section className="garden-newsletter" aria-labelledby="garden-newsletter-title"><div><p className="garden-eyebrow">A letter, every now and then</p><h2 id="garden-newsletter-title">Stay in the <em>loop.</em></h2><p>New things, useful notes, and a glimpse of what’s growing.</p></div><HomeSubscribe/></section>}
            <GardenFooter />
        </div>
    );
}
