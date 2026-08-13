import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import { resolve } from "path";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL,
  i18n: {
    defaultLocale: "it",
    locales: ["it", "en"],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("component-inventory") &&
        !page.includes("/search") &&
        !page.includes("/ricerca"),
      i18n: {
        defaultLocale: "it",
        locales: {
          it: "it",
          en: "en",
        },
      },
      // Emit slash-less <loc> and hreflang URLs so the sitemap matches the
      // canonical/hreflang tags (SeoHreflang.astro), which strip the trailing
      // slash. Never strip the domain root ("https://host/").
      serialize(item) {
        const stripTrailingSlash = (url: string) =>
          url.replace(/([^/])\/$/, "$1");
        item.url = stripTrailingSlash(item.url);
        if (item.links) {
          item.links = item.links.map((link) => ({
            ...link,
            url: stripTrailingSlash(link.url),
          }));
        }
        return item;
      },
    }),
    react(),
  ],
  adapter: vercel({
    // edgeMiddleware stays OFF: bundling the middleware for Vercel's Edge
    // Runtime pulls in es-module-lexer, which calls WebAssembly.compile() at
    // module scope. The Edge Runtime forbids Wasm code generation, so the
    // middleware crashed ("Wasm code generation disallowed by embedder") and
    // took down the routes it fronts — /api/preview-links included.
    // src/middleware.ts only sets locals.lang, so the Node runtime is fine.
    edgeMiddleware: false,
  }),
  redirects: {
    "/": {
      status: 301,
      destination: "/it",
    },
    // @astrojs/sitemap only emits sitemap-index.xml; keep the conventional
    // URL working for humans and tools that expect it.
    "/sitemap.xml": {
      status: 301,
      destination: "/sitemap-index.xml",
    },
  },
  vite: {
    define: {
      // Bakes the landing/full-site mode into every bundle, including the
      // serverless routes where runtime env vars are not configurable.
      __SHOW_ALL_PAGES__: JSON.stringify(process.env.SHOW_ALL_PAGES === "true"),
    },
    ssr: {
      noExternal: ["graph-italia-components"],
    },
    resolve: {
      alias: {
        "/^@(.*)$/": resolve("./src/*"),
        "@splidejs/splide/src/css/core/index": resolve(
          "node_modules/@splidejs/splide/src/css/core/index.scss",
        ),
        "@bootstrap-src": "/node_modules/bootstrap-italia/src",
      },
    },
  },
  build: {
    inlineStylesheets: "always",
  },
});
