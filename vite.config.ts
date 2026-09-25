import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {ROUTES, renderSeoHead, type View} from './src/seo';

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;

// Injects per-route <head> tags and, on build, writes services.html etc. plus
// robots.txt and sitemap.xml so each URL has its own title/description/canonical.
function seo(siteUrl: string): Plugin {
  let outDir = 'dist';
  let isBuild = false;
  return {
    name: 'ez-seo',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      isBuild = config.command === 'build';
    },
    transformIndexHtml: {
      order: 'pre',
      handler: html => html.replace('<!--seo-head-->', renderSeoHead('home', siteUrl)),
    },
    closeBundle() {
      if (!isBuild) return;
      const indexHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const view of Object.keys(ROUTES) as View[]) {
        if (view === 'home') continue;
        const file = path.join(outDir, `${ROUTES[view].path.slice(1)}.html`);
        fs.writeFileSync(file, indexHtml.replace(SEO_BLOCK, renderSeoHead(view, siteUrl)));
      }

      const robots = ['User-agent: *', 'Allow: /'];
      if (siteUrl) {
        robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
        const urls = (Object.keys(ROUTES) as View[])
          .filter(view => !ROUTES[view].noindex)
          .map(view => `  <url><loc>${siteUrl}${ROUTES[view].path}</loc></url>`);
        fs.writeFileSync(
          path.join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
        );
      } else {
        console.warn('[ez-seo] No VITE_SITE_URL or Netlify URL set: skipping sitemap.xml and absolute canonical/og URLs.');
      }
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robots.join('\n') + '\n');
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Netlify sets URL to the site's primary address during builds.
  const siteUrl = (env.VITE_SITE_URL || process.env.URL || '').replace(/\/+$/, '');
  return {
    plugins: [react(), tailwindcss(), seo(siteUrl)],
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
