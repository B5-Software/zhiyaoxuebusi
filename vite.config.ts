import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // Relative base keeps the same build working at the domain root (Cloudflare Pages)
  // and under a repository sub-path (GitHub Pages project sites).
  base: './',
  plugins: [react(), tailwindcss(), {
    name: 'offline-asset-list',
    generateBundle(_options, bundle) {
      this.emitFile({ type: 'asset', fileName: 'cache-manifest.json', source: JSON.stringify(Object.keys(bundle).filter(name => /\.(js|css|woff2?)$/.test(name))) });
    },
  }],
  define: { 'import.meta.env.APP_VERSION': JSON.stringify(JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version) },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
