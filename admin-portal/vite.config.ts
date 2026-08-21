import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env from parent directory (d:/eduspace/eduspace/.env)
  const parentEnvDir = path.resolve(__dirname, "..");
  const env = loadEnv(mode, parentEnvDir, "");

  return {
    root: path.resolve(__dirname),
    envDir: parentEnvDir,
    server: {
      host: "0.0.0.0",
      port: 5174,
      strictPort: false,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Pass VITE_ variables loaded from the parent root .env file
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
      ),
      "import.meta.env.VITE_TURNSTILE_SITE_KEY": JSON.stringify(""),
    },
  };
});
