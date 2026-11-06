import Link from 'next/link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import GardenWordmark from './GardenWordmark';

export default function GardenFooter() {
    return <footer className="garden-footer" aria-label="Site footer">
        <div className="garden-footer-invitation">
            <div><p className="garden-eyebrow">The end of the page. Not the conversation.</p><Link href="/contact" className="garden-footer-hello">Have something<br/>in <em>mind?</em><ArrowUpRight aria-hidden="true"/></Link></div>
            <div className="garden-envelope" aria-hidden="true"><div className="garden-letter"><span>TO: SOMEONE CURIOUS</span><span>A little hello<br/>goes a long way.</span><span>with love, avrxt.</span></div><div className="garden-envelope-front"/><div className="garden-wax-seal">a.</div></div>
        </div>
        <div className="garden-footer-directory">
            <div className="garden-footer-note"><p>A personal corner<br/>of a very big internet.</p><span>Built in India.<br/>Code, music & things worth keeping.</span><a href="mailto:support@avrxt.dev">support@avrxt.dev <ArrowUpRight size={13}/></a></div>
            <nav aria-label="Footer explore"><h2>Wander</h2><Link href="/about">About me</Link><Link href="/tools">The workshop</Link><Link href="https://muzix.avrxt.dev">Muzix</Link><Link href="https://docs.avrxt.dev">Field notes</Link><Link href="/guestbook">Guestbook</Link></nav>
            <nav aria-label="Footer social"><h2>Elsewhere</h2><a href="https://github.com/aviorxt">GitHub <ArrowUpRight size={12}/></a><a href="https://www.instagram.com/aviorxt/">Instagram <ArrowUpRight size={12}/></a><Link href="https://me.avrxt.dev">My profile <ArrowUpRight size={12}/></Link><Link href="/status">System status</Link><Link href="/uses">What I use</Link></nav>
            <nav aria-label="Footer legal"><h2>The small print</h2><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/security">Security</Link><Link href="/legal/assets">Brand assets</Link><Link href="/legal/refund">Refunds</Link></nav>
        </div>
        <div className="garden-footer-status-row"><span>Independent by design. Connected by the web.</span><StatusBadge variant="garden" /></div>
        <div className="garden-footer-wordmark" aria-hidden="true"><GardenWordmark large /></div>
        <div className="garden-footer-bottom"><span>© 2024–{new Date().getFullYear()} AVRXT</span><span>with 🩶 @avrxt</span><a href="#garden-top">Back to the garden <ArrowUp size={13}/></a></div>
    </footer>;
}
