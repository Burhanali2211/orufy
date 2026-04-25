export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, '');
}
