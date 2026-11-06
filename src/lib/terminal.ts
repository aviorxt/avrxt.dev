export type TerminalPage = { command: string; title: string; description: string; href: string; group: 'site' | 'tools' | 'docs' | 'legal'; external?: boolean };
export type TerminalResult = { text: string; pages?: TerminalPage[]; navigate?: string; clear?: boolean; history?: boolean; error?: boolean };
export const COMMAND_LIMIT = 240;
export const TERMINAL_PAGES: TerminalPage[] = [
  { command: 'home', title: 'Home', description: 'Independent development, aviation, and useful ideas.', href: '/', group: 'site' },
  { command: 'about', title: 'About', description: 'The person behind AVRXT.', href: '/about', group: 'site' },
  { command: 'profile', title: 'Profile', description: 'Selected links, presence, and current frequency.', href: 'https://me.avrxt.dev', group: 'site', external: true },
  { command: 'contact', title: 'Contact', description: 'Start a conversation or discuss a project.', href: '/contact', group: 'site' },
  { command: 'signature', title: 'Signature', description: 'The AVRXT digital mark.', href: '/signature', group: 'site' },
  { command: 'uses', title: 'Uses', description: 'Hardware, software, and everyday instruments.', href: '/uses', group: 'site' },
  { command: 'music', title: 'Muzix', description: 'Live Spotify listening chart.', href: 'https://muzix.avrxt.dev', group: 'site', external: true },
  { command: 'subscribe', title: 'Newsletter', description: 'Subscribe to AVRXT updates with email confirmation.', href: '/subscribe', group: 'site' },
  { command: 'docs', title: 'Documentation', description: 'Published technical notes and resources.', href: 'https://docs.avrxt.dev', group: 'docs', external: true },
  { command: 'tools', title: 'Tools', description: 'Focused browser and network utilities.', href: '/tools', group: 'tools' },
  { command: 'api', title: 'API documentation', description: 'The public API reference.', href: 'https://docs.avrxt.dev/api-reference/overview', group: 'docs', external: true },
  { command: 'privacy', title: 'Privacy', description: 'Data handling, providers, and your choices.', href: '/legal/privacy', group: 'legal' },
  { command: 'terms', title: 'Terms', description: 'Website rules and responsibilities.', href: '/legal/terms', group: 'legal' },
  { command: 'security', title: 'Security', description: 'Safeguards and responsible disclosure.', href: '/legal/security', group: 'legal' },
  { command: 'announcements', title: 'Announcements', description: 'Official AVRXT security notices and detailed public issue reports.', href: '/announcements', group: 'legal' },
  { command: 'refund', title: 'Refunds', description: 'Refunds for eligible paid project work.', href: '/legal/refund', group: 'legal' },
  { command: 'assets', title: 'Brand assets', description: 'Official logos and brand rights.', href: '/legal/assets', group: 'legal' },
  { command: 'ownership', title: 'Ownership', description: 'Ownership and independence notice.', href: '/annon/ownership', group: 'legal' },
  { command: 'discord-privacy', title: 'Discord privacy', description: 'Discord application data handling.', href: '/dc/privacy', group: 'legal' },
  { command: 'discord-terms', title: 'Discord terms', description: 'Discord application terms.', href: '/dc/terms', group: 'legal' },
  { command: 'terminal', title: 'Terminal', description: 'Explore the website with commands.', href: '/terminal', group: 'site' },
  { command: 'status', title: 'System status', description: 'Service availability, uptime, public incidents, and maintenance.', href: '/status', group: 'site' },
];

const HELP = 'help                 Command reference\npages [site|tools|docs|legal]  Browse pages\nsearch <words>       Find a page or published note\nopen <command|path>  Go to a listed page\nprofile / contact    Preview a page and its link\ntools / docs         Browse utilities or published notes\nwhoami / pwd         Visitor session / current location\necho <text>          Display plain text\nhistory              Recent commands in this tab\nclear                Clear output and command history\n\n↑ ↓ recall history · Tab completes a unique match · Ctrl+L clears\nTry: open profile, pages legal, search dns';
const aliases: Record<string, string> = { ls: 'pages', dir: 'pages', '?': 'help', me: 'profile', muzix: 'music', newsletter: 'subscribe', cls: 'clear' };
const aliasFor = (value: string) => Object.hasOwn(aliases, value) ? aliases[value] : value;
const verbs = ['help', 'pages', 'search', 'open', 'whoami', 'pwd', 'echo', 'history', 'clear'];

export function resolveTerminalPage(target: string, pages: TerminalPage[]) {
  const normalized = target.trim().toLowerCase();
  const alias = aliasFor(normalized);
  // The argument is never treated as a URL. Only catalog entries are eligible.
  return pages.find(page => page.command === alias || page.href === normalized);
}

export function runTerminalCommand(input: string, pages: TerminalPage[]): TerminalResult {
  if (input.length > COMMAND_LIMIT || /[\u0000-\u001f\u007f]/.test(input)) return { text: `Use one command of up to ${COMMAND_LIMIT} characters.`, error: true };
  const command = input.trim();
  if (!command) return { text: '' };
  const [rawVerb, ...words] = command.split(/ +/);
  const verb = aliasFor(rawVerb.toLowerCase());
  const argument = words.join(' ');
  if (verb === 'echo') return { text: argument };
  if (verb === 'search') {
    if (!argument) return { text: 'Usage: search <words>. Try search music.', error: true };
    const query = argument.toLowerCase();
    const found = pages.filter(page => `${page.command} ${page.title} ${page.description} ${page.href}`.toLowerCase().includes(query));
    return { text: found.length ? `${found.length} matching pages.` : 'No matching pages. Try pages or a different search.', pages: found };
  }
  if (verb === 'pages') {
    if (argument && !['site', 'tools', 'docs', 'legal'].includes(argument.toLowerCase())) return { text: 'Usage: pages [site|tools|docs|legal]', error: true };
    const found = argument ? pages.filter(page => page.group === argument.toLowerCase()) : pages;
    return { text: `${found.length} public destinations. Click a page or type open followed by its command.`, pages: found };
  }
  if (verb === 'open') {
    const page = resolveTerminalPage(argument, pages);
    return page ? { text: `Opening ${page.title}…`, navigate: page.href } : { text: 'Choose a listed public page. Try open profile or pages.', error: true };
  }
  if (argument) return { text: 'That command does not take arguments. Type help for examples.', error: true };
  switch (verb) {
    case 'help': return { text: HELP };
    case 'clear': return { text: '', clear: true };
    case 'history': return { text: '', history: true };
    case 'whoami': return { text: 'guest@avrxt\nA public browser session. No account is needed to explore.' };
    case 'pwd': return { text: '/terminal' };
    case 'tools': return { text: 'Public utilities. Open a tool to use it.', pages: pages.filter(page => page.group === 'tools') };
    case 'docs': return { text: 'Published notes and API references. The documentation page has the complete archive.', pages: pages.filter(page => page.group === 'docs') };
    default: {
      const page = resolveTerminalPage(verb, pages);
      return page ? { text: page.description, pages: [page] } : { text: `Unknown command: ${rawVerb}. Type help to see available commands.`, error: true };
    }
  }
}

export function terminalCompletions(input: string, pages: TerminalPage[]) {
  const normalized = input.trimStart().toLowerCase();
  if (normalized.startsWith('open ')) {
    const target = normalized.slice(5);
    return pages.map(page => `open ${target.startsWith('/') ? page.href : page.command}`)
      .filter(value => value.startsWith(normalized) && !value.includes('https:'));
  }
  if (normalized.includes(' ')) return [];
  return [...new Set([...verbs, ...pages.map(page => page.command)])].filter(value => value.startsWith(normalized));
}
