export const CONFIRMATION_FROM = 'avrxt · Confirm <confirm@avrxt.dev>';
export const WELCOME_FROM = 'aviorxt at avrxt.dev <info@avrxt.dev>';
const SITE = 'https://www.avrxt.dev';
function escape(value: string) { return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!)); }
function safeLink(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid newsletter URL');
  return escape(url.toString());
}
const sans = "'Outfit','Trebuchet MS',Arial,sans-serif";
const mono = "'Space Mono','Courier New',monospace";
function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" bgcolor="#efefef" style="border:1px solid #ffffff;border-radius:12px;mso-padding-alt:18px 22px"><a href="${safeLink(href)}" style="display:block;padding:18px 22px;color:#080808;font:600 15px ${sans};text-decoration:none;text-align:center">${escape(label)} &nbsp; &#8594;</a></td></tr></table>`;
}
function shell({ preheader, label, image, imageAlt, content, footer }: { preheader: string; label: string; image: string; imageAlt: string; content: string; footer: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${escape(label)} | avrxt</title><style>
@font-face{font-family:Outfit;font-style:normal;font-weight:100 900;src:url('${SITE}/newsletter/fonts/Outfit-Variable.ttf') format('truetype')}
@font-face{font-family:'Space Mono';font-style:normal;font-weight:400;src:url('${SITE}/newsletter/fonts/SpaceMono-Regular.ttf') format('truetype')}
@media only screen and (max-width:620px){.email-wrap{width:100%!important}.email-pad{padding-left:24px!important;padding-right:24px!important}.email-title{font-size:37px!important;line-height:41px!important}.outer-pad{padding:18px 8px!important}}
</style></head><body style="margin:0;padding:0;background:#050505;color:#efefef;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;color:#050505;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escape(preheader)}${'&#8204;&nbsp;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050505"><tr><td class="outer-pad" align="center" style="padding:40px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="email-wrap" width="600" cellpadding="0" cellspacing="0" bgcolor="#0b0b0b" style="width:100%;max-width:600px;border:1px solid #282828;border-radius:24px;overflow:hidden">
<tr><td class="email-pad" style="padding:30px 36px 24px;border-bottom:1px solid #242424"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><a href="${SITE}" style="text-decoration:none;color:#f5f5f5;font:600 21px ${sans};letter-spacing:-1px">avrxt<span style="color:#666">.dev</span></a></td><td align="right" style="font:9px ${mono};letter-spacing:2px;color:#888">NEWSLETTER / ${escape(label)}</td></tr></table></td></tr>
<tr><td class="email-pad" style="padding:24px 36px 0"><img src="${SITE}/newsletter/${image}" width="528" height="170" alt="${escape(imageAlt)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;color:#aaa;font:12px ${sans}"></td></tr>
<tr><td class="email-pad" style="padding:14px 36px 36px;font-family:${sans}">${content}</td></tr>
<tr><td class="email-pad" style="padding:24px 36px;border-top:1px solid #242424;color:#777;font:11px/19px ${sans}">${footer}<p style="margin:16px 0 0;font:9px ${mono};letter-spacing:1px;color:#666">INDEPENDENTLY BUILT. THOUGHTFULLY SHARED.</p></td></tr>
</table><table role="presentation" width="600" class="email-wrap" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px"><tr><td align="center" style="padding:24px;font:10px/18px ${sans};color:#666">avrxt.dev &nbsp; / &nbsp; by aviorxt &nbsp; / &nbsp; India<br><a href="${SITE}/privacy" style="color:#888;text-decoration:underline">Privacy</a> &nbsp; · &nbsp; <a href="${SITE}/contact" style="color:#888;text-decoration:underline">Contact</a></td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
function heading(eyebrow: string, title: string, accent: string) {
  return `<p style="margin:0 0 18px;color:#888;font:10px ${mono};letter-spacing:2px">${escape(eyebrow)}</p><h1 class="email-title" style="margin:0 0 22px;color:#f5f5f5;font:600 46px/49px ${sans};letter-spacing:-2px">${escape(title)}<br><span style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-style:italic;color:#b8b8b8;letter-spacing:-1px">${escape(accent)}</span></h1>`;
}
export function confirmationEmail(url: string) {
  const content = `${heading('ONE LAST STEP / EMAIL VERIFICATION', 'A little less noise.', 'A better signal.')}<p style="margin:0 0 26px;color:#aaa;font:15px/25px ${sans}">You’re one click away from joining my newsletter. Confirm your email to receive updates on what I’m building, technical notes, and ideas worth sharing.</p>${button('Confirm my subscription', url)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:18px 0 24px;font:10px/18px ${mono};color:#777;text-align:center">SECURE LINK &nbsp; / &nbsp; EXPIRES IN 24 HOURS &nbsp; / &nbsp; SINGLE USE</td></tr></table><p style="margin:0 0 7px;color:#ddd;font:15px ${sans}">See you on the other side,</p><p style="margin:0;color:#aaa;font:italic 23px Georgia,'Times New Roman',serif">aviorxt</p>`;
  return { from: CONFIRMATION_FROM, subject: 'One click away — confirm your avrxt subscription',
    html: shell({ preheader: 'A better signal is one click away. Confirm your email to join the avrxt newsletter.', label: 'CONFIRM', image: 'confirmation-doodle.png', imageAlt: 'A hand-drawn envelope, a paper plane, and little sparks of signal', content,
      footer: `You requested this confirmation on avrxt.dev. If that wasn’t you, simply ignore this email; you won’t be subscribed.<br><br>Button not working? <a href="${safeLink(url)}" style="color:#aaa;text-decoration:underline">Open your secure confirmation link</a>.` }),
    text: `A little less noise. A better signal.\n\nConfirm your email to receive avrxt updates, technical notes, and ideas worth sharing.\n\nConfirm subscription: ${url}\n\nThis link expires in 24 hours and can be used only once. Opening it will not subscribe you until you confirm.\n\nIf you did not request this, ignore this email.\n\naviorxt\nhttps://www.avrxt.dev/privacy`,
  };
}
export function welcomeEmail(unsubscribeUrl: string) {
  const rows = [ ['01', 'Explore the notes', 'Technical ideas, written with care.', 'https://docs.avrxt.dev'], ['02', 'Try the tools', 'Small utilities for everyday work.', '/tools'], ['03', 'Meet the maker', 'A little more about me and what I build.', 'https://me.avrxt.dev'] ];
  const links = rows.map(([number, title, description, path]) => {
    const href = path.startsWith('https://') ? path : `${SITE}${path}`;
    return `<tr><td width="35" valign="top" style="padding:18px 0;border-top:1px solid #242424;color:#666;font:11px ${mono}">${number}</td><td style="padding:16px 0;border-top:1px solid #242424"><a href="${safeLink(href)}" style="color:#ddd;text-decoration:none;font:600 14px ${sans}">${title} &#8599;</a><p style="margin:6px 0 0;font:12px/19px ${sans};color:#888">${description}</p></td></tr>`;
  }).join('');
  const content = `${heading('EMAIL CONFIRMED / SIGNAL CONNECTED', 'You’re on the list.', 'Make yourself at home.')}<p style="margin:0 0 22px;color:#aaa;font:15px/25px ${sans}">Thanks for being here. I’m aviorxt — an independent developer and aircraft maintenance engineer. This is where I share things I build, useful technical notes, and ideas I think you’ll enjoy.</p><p style="margin:0 0 24px;color:#aaa;font:15px/25px ${sans}">Expect thoughtful updates, with room to breathe between them. You can leave whenever you like.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">${links}</table>${button('Explore avrxt.dev', SITE)}<p style="margin:28px 0 7px;color:#ddd;font:15px ${sans}">Glad you found your way here,</p><p style="margin:0;color:#aaa;font:italic 23px Georgia,'Times New Roman',serif">aviorxt</p>`;
  return { from: WELCOME_FROM, subject: 'You’re on the list — welcome to avrxt',
    html: shell({ preheader: 'Your email is confirmed. Welcome to the signal — make yourself at home.', label: 'WELCOME', image: 'welcome-doodle.png', imageAlt: 'A hand-drawn constellation with a tiny planet, a check mark, and a waving spark', content,
      footer: `You’re receiving this welcome because you confirmed your avrxt newsletter subscription.<br><a href="${safeLink(unsubscribeUrl)}" style="color:#aaa;text-decoration:underline">Unsubscribe from avrxt emails</a> — no hard feelings.` }),
    text: `You’re on the list. Make yourself at home.\n\nYour email is confirmed. I’m aviorxt, an independent developer and aircraft maintenance engineer. Expect thoughtful updates on things I build, technical notes, and useful ideas.\n\nExplore the notes: https://docs.avrxt.dev\nTry the tools: ${SITE}/tools\nMeet the maker: https://me.avrxt.dev\n\nGlad you’re here,\naviorxt\n\nUnsubscribe anytime: ${unsubscribeUrl}\nPrivacy: ${SITE}/privacy`,
  };
}
