// Route + SEO definitions shared by the app (runtime <head> updates) and
// vite.config.ts (static per-route HTML, robots.txt and sitemap.xml at build time).
// Keep this file free of top-level DOM access so it can be imported by Node.

export type View = 'home' | 'catalog' | 'gallery' | 'contact';

export const SITE_NAME = 'EZ Performance';
export const PHONE_DISPLAY = '805-588-8082';
export const PHONE_E164 = '+18055888082';

export const SERVICE_AREA = [
  'Lompoc', 'Santa Maria', 'Orcutt', 'Nipomo',
  'Arroyo Grande', 'Grover Beach', 'Pismo Beach',
  'San Luis Obispo', 'Atascadero', 'Templeton', 'Paso Robles'
];

interface RouteSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const ROUTES: Record<View, RouteSeo> = {
  home: {
    path: '/',
    title: 'EZ Performance | Auto Diagnostics & Repair, Lompoc to Paso Robles',
    description: 'ASE Certified Master Technician Ethan Zandonatti offers shop and mobile auto diagnostics, repair and maintenance across the Central Coast, from Lompoc to Paso Robles.'
  },
  catalog: {
    path: '/services',
    title: 'Services & Pricing | EZ Performance',
    description: 'Oil changes, brakes, AC service, diagnostics, electrical, lift and leveling kits, EV battery checks and towing. Upfront starting prices from EZ Performance.'
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery | EZ Performance',
    description: 'Photos of recent EZ Performance projects are coming soon.',
    noindex: true
  },
  contact: {
    path: '/contact',
    title: 'Contact & Booking | EZ Performance',
    description: `Call ${PHONE_DISPLAY} or book online. Shop and mobile service from Lompoc to Paso Robles with same-day response.`
  }
};

export function viewFromPath(pathname: string): View {
  const clean = pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  const match = (Object.keys(ROUTES) as View[]).find(v => ROUTES[v].path === clean);
  return match ?? 'home';
}

function absoluteUrl(siteUrl: string, path: string) {
  return `${siteUrl}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function structuredData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: SITE_NAME,
    description: ROUTES.home.description,
    ...(siteUrl && { url: `${siteUrl}/`, image: `${siteUrl}/motor-logo.png` }),
    telephone: PHONE_E164,
    founder: { '@type': 'Person', name: 'Ethan Zandonatti' },
    areaServed: SERVICE_AREA.map(name => ({ '@type': 'City', name: `${name}, CA` }))
  };
}

// Builds the SEO block of <head> for a route. Wrapped in markers so the build
// step can swap it out when writing the per-route HTML files.
export function renderSeoHead(view: View, siteUrl: string) {
  const route = ROUTES[view];
  const url = absoluteUrl(siteUrl, route.path);
  const image = `${siteUrl}/motor-logo.png`;
  const tags = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    route.noindex ? `<meta name="robots" content="noindex" />` : '',
    siteUrl ? `<link rel="canonical" href="${url}" />` : '',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    siteUrl ? `<meta property="og:url" content="${url}" />` : '',
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary" />`,
    view === 'home'
      ? `<script type="application/ld+json">${JSON.stringify(structuredData(siteUrl))}</script>`
      : ''
  ].filter(Boolean);
  return `<!--seo:start-->\n    ${tags.join('\n    ')}\n    <!--seo:end-->`;
}

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

// Keeps <head> in sync after client-side navigation.
export function applySeo(view: View, siteUrl: string) {
  const route = ROUTES[view];
  const url = absoluteUrl(siteUrl, route.path);
  document.title = route.title;
  setMeta('meta[name="description"]', 'content', route.description);
  setMeta('meta[property="og:title"]', 'content', route.title);
  setMeta('meta[property="og:description"]', 'content', route.description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('link[rel="canonical"]', 'href', url);

  let robots = document.head.querySelector('meta[name="robots"]');
  if (route.noindex && !robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex');
    document.head.appendChild(robots);
  } else if (!route.noindex && robots) {
    robots.remove();
  }
}
