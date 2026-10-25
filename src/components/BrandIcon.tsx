import type { IconType } from 'react-icons';
import {
  FaDiscord,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaRedditAlien,
  FaSoundcloud,
  FaSpotify,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';

const icons: Record<string, IconType> = {
  Discord: FaDiscord,
  Github: FaGithub,
  Instagram: FaInstagram,
  Linkedin: FaLinkedin,
  Spotify: FaSpotify,
  Youtube: FaYoutube,
  X: FaXTwitter,
  Twitch: FaTwitch,
  Tiktok: FaTiktok,
  Reddit: FaRedditAlien,
  Soundcloud: FaSoundcloud,
  Pinterest: FaPinterest,
};

export const brandIconOptions = Object.keys(icons);

export function BrandIcon({ name, className, title }: { name?: string; className?: string; title?: string }) {
  const Icon = name ? icons[name] : undefined;
  return Icon ? <Icon className={className} aria-hidden={title ? undefined : true} title={title} /> : null;
}
