import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig(async ({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  await import("./src/env");

  return {
    plugins: [
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
    ],
    server: {
      host: "localhost",
      port: 3000,
    },
  };
});

export default config;
