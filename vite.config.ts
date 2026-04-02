import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), "");
  const adminProxyTarget = env.VITE_PROXY_TARGET || "http://127.0.0.1:3000";
  const mainProxyTarget =
    env.VITE_MAIN_PROXY_TARGET || "http://127.0.0.1:6900";

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Elara-Backend-v1 (automation rules, etc.) — must be before `/api` so `/api/v2` is not swallowed
      "/api/v2": {
        target: mainProxyTarget,
        changeOrigin: true,
      },
      "/api": {
        target: adminProxyTarget,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
