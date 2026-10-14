import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { heroShell } from "./src/lib/shell";

// Netlify sets `URL` to the site's main address during builds. Set SITE_URL
// to override it (for a custom domain, say).
const SITE_URL = (process.env.SITE_URL || process.env.URL || "https://nirbyoleek.netlify.app").replace(/\/$/, "");

/**
 * Fills %SITE_URL% in index.html, writes the hero into the page as static
 * HTML so it paints before JavaScript loads, and emits robots.txt and
 * sitemap.xml.
 */
function seo(): Plugin {
  return {
    name: "portfolio-seo",
    transformIndexHtml: (html) =>
      html.replaceAll("%SITE_URL%", SITE_URL).replace('<div id="root"></div>', `<div id="root">${heroShell()}</div>`),
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          `  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod></url>\n` +
          `</urlset>\n`,
      });
    },
  };
}

// `base: "./"` keeps asset paths relative, so the build works on any static host.
export default defineConfig({
  base: "./",
  plugins: [react(), seo()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // three.js only loads with the 3D scenes, as its own cached chunk.
        manualChunks: { three: ["three"] },
      },
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
