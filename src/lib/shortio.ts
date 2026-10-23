import 'server-only';

export type ShortLink = {
  idString: string;
  shortURL: string;
  originalURL: string;
  path: string;
  title?: string | null;
  tags?: string[];
  redirectType?: number | null;
  expiresAt?: string | null;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ShortLinkInput = {
  originalURL: string;
  path?: string;
  title?: string;
  tags?: string[];
  redirectType?: 301 | 302 | 307 | 308;
  expiresAt?: string;
  archived?: boolean;
};

function configuration() {
  const apiKey = process.env.SHORT_IO_API_KEY?.trim();
  const domain = process.env.SHORT_IO_DOMAIN?.trim();
  if (!apiKey || !domain) throw new Error('Short.io is not configured. Add SHORT_IO_API_KEY and SHORT_IO_DOMAIN in Vercel.');
  return { apiKey, domain };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey } = configuration();
  const response = await fetch(`https://api.short.io${path}`, {
    ...init,
    headers: { Accept: 'application/json', Authorization: apiKey, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null) as { message?: string; error?: string } | T | null;
  if (!response.ok) {
    const message = body && typeof body === 'object' && ('message' in body || 'error' in body) ? (body.message || body.error) : '';
    throw new Error(message || `Short.io request failed (${response.status}).`);
  }
  return body as T;
}

function payload(input: ShortLinkInput, domain: string) {
  return {
    originalURL: input.originalURL,
    domain,
    ...(input.path ? { path: input.path } : {}),
    ...(input.title ? { title: input.title } : {}),
    tags: input.tags || [],
    redirectType: input.redirectType || 302,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    archived: input.archived === true,
  };
}

export async function listShortLinks() {
  const { domain } = configuration();
  const domains = await request<Array<{ id: number; hostname: string }>>('/api/domains?limit=100&offset=0');
  const domainId = domains.find(item => item.hostname.toLowerCase() === domain.toLowerCase())?.id;
  if (!domainId) throw new Error(`The Short.io domain ${domain} was not found for this API key.`);
  const result = await request<{ links?: ShortLink[] }>(`/api/links?domain_id=${encodeURIComponent(domainId)}&limit=150&dateSortOrder=desc`);
  return result.links || [];
}

export async function createShortLink(input: ShortLinkInput) {
  const { domain } = configuration();
  return request<ShortLink>('/links', { method: 'POST', body: JSON.stringify({ ...payload(input, domain), allowDuplicates: false }) });
}

export async function updateShortLink(id: string, input: ShortLinkInput) {
  const { domain } = configuration();
  return request<ShortLink>(`/links/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify(payload(input, domain)) });
}

export async function deleteShortLink(id: string) {
  return request<{ success?: boolean }>(`/links/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
