import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.webmanifest",
      manifest: {
        name: "Nura",
        short_name: "Nura",
        description:
          "Filipino healthcare access navigator for practical care routing and benefits guidance.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f8faf7",
        theme_color: "#1b6b3a",
        lang: "fil-PH",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,webmanifest,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.endsWith("/chat"),
            handler: "NetworkFirst",
            options: {
              cacheName: "nura-chat-cache",
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
