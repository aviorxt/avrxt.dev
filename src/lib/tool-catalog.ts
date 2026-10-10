import {
  AtSign,
  BookOpenText,
  Braces,
  CircleHelp,
  Globe2,
  Keyboard,
  Music2,
  Network,
  type LucideIcon,
} from 'lucide-react';

export type ToolSlug = 'whatismyip' | 'portcheck' | 'mailfy' | 'dns' | 'fontui' | 'spotmp3' | 'quote' | 'keytest';

export type ToolDefinition = {
  slug: ToolSlug;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
};

export const tools: ToolDefinition[] = [
  { slug: 'whatismyip', title: 'What is my IP?', shortTitle: 'IP', description: 'Inspect the public network address and request details visible to avrxt.dev.', eyebrow: 'Network identity', icon: Globe2 },
  { slug: 'portcheck', title: 'Port checker', shortTitle: 'Port', description: 'Test one TCP port on a public host you own or are authorized to inspect.', eyebrow: 'Public reachability', icon: Network },
  { slug: 'mailfy', title: 'Mailfy', shortTitle: 'Mail', description: 'Check email syntax and whether its domain publishes mail-routing records.', eyebrow: 'Email diagnostics', icon: AtSign },
  { slug: 'dns', title: 'DNS + RDAP', shortTitle: 'DNS', description: 'Query public DNS record types and registration data without leaving the interface.', eyebrow: 'Domain intelligence', icon: Braces },
  { slug: 'fontui', title: 'Font UI', shortTitle: 'Fonts', description: 'Preview your text against 300+ open-source Google Fonts, loaded only when selected.', eyebrow: 'Type laboratory', icon: BookOpenText },
  { slug: 'spotmp3', title: 'Spotify preview', shortTitle: 'Spotify', description: 'Open a lawful Spotify embed from a track, album, artist, episode, show, or playlist link.', eyebrow: 'Official playback', icon: Music2 },
  { slug: 'quote', title: 'Random quote', shortTitle: 'Quote', description: 'Pull a fresh thought from an open quote source whenever you need a reset.', eyebrow: 'Creative signal', icon: CircleHelp },
  { slug: 'keytest', title: 'Keyboard tester', shortTitle: 'Keys', description: 'Test every physical key against a responsive, realistic 3D keyboard model in your browser.', eyebrow: 'Input diagnostics', icon: Keyboard },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
