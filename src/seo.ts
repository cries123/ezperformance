export type View = 'home' | 'catalog' | 'gallery' | 'contact';

const SITE_NAME = 'EZ Performance';

export const SEO_CONFIG: Record<
  View,
  { title: string; description: string; path: string }
> = {
  home: {
    title: 'EZ Performance | Automotive Diagnostics & Repair',
    description:
      'Master-level automotive diagnostics, engine repair, and performance maintenance by Ethan Zandonatti. Shop and mobile service from Lompoc to Paso Robles, CA.',
    path: '/',
  },
  catalog: {
    title: 'Automotive Services | EZ Performance',
    description:
      'Professional automotive diagnostics, engine repair, performance tuning, and maintenance. European, JDM, and exotic platforms. Serving the Central Coast of California.',
    path: '/services',
  },
  gallery: {
    title: 'Project Gallery | EZ Performance',
    description:
      'Project gallery for EZ Performance automotive repair and performance work. Coming soon — check back for photos of our latest builds and service projects.',
    path: '/gallery',
  },
  contact: {
    title: 'Contact & Booking | EZ Performance',
    description:
      'Contact EZ Performance for automotive diagnostics and repair. Call 805-588-8082 or start a booking. Mobile dispatch from Lompoc to Paso Robles.',
    path: '/contact',
  },
};

export function getSiteUrl(): string {
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://ezperformance.com';
}

export function viewFromPath(path: string): View {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/services' || normalized === '/catalog') return 'catalog';
  if (normalized === '/gallery') return 'gallery';
  if (normalized === '/contact') return 'contact';
  return 'home';
}

export function pathForView(view: View): string {
  return SEO_CONFIG[view].path;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function updatePageSeo(view: View) {
  const config = SEO_CONFIG[view];
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${config.path}`;

  document.title = config.title;

  setMeta('name', 'description', config.description);
  setMeta('property', 'og:title', config.title);
  setMeta('property', 'og:description', config.description);
  setMeta('property', 'og:url', pageUrl);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('name', 'twitter:title', config.title);
  setMeta('name', 'twitter:description', config.description);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = pageUrl;
}
