import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiMatch = /^(https?:\/\/[^/]+)(\/.*)?$/.exec(
    env.VITE_API_URL || "http://localhost:5000/api"
  );
  const apiTarget = apiMatch?.[1] || "http://localhost:5000";
  const apiPath = (apiMatch?.[2] || "").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith("https://"),
          rewrite: (requestPath) =>
            requestPath.replace(/^\/api(?=\/|$)/, apiPath),
        },
      },
    },
  };
});