import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      deny: ["**/.dev.vars*", "**/.env*", "**/.git/**", "**/*.{crt,pem}"],
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
      config: {
        main: "./worker/index.ts",
        compatibility_date: "2026-05-15",
        compatibility_flags: ["nodejs_compat"],
      },
    }),
  ],
});
