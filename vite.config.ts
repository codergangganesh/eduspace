import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";

import { VitePWA } from "vite-plugin-pwa";

function vercelOAuthDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: "vercel-oauth-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/vercel-oauth" && req.method === "POST") {
          let bodyStr = "";
          req.on("data", (chunk) => {
            bodyStr += chunk;
          });
          req.on("end", async () => {
            try {
              const body = JSON.parse(bodyStr || "{}");
              const action = body.action;

              const clientId =
                env.VERCEL_CLIENT_ID ||
                env.VITE_VERCEL_CLIENT_ID ||
                "oac_nw2dfW7drJqGrQ9SrpWIQ1cc";
              const clientSecret =
                env.VERCEL_CLIENT_SECRET || "9GIeS6bB0jXNcP6nbeBL0cnf";
              const defaultRedirect =
                env.VERCEL_REDIRECT_URI ||
                env.VITE_VERCEL_REDIRECT_URI ||
                "http://localhost:8080/auth/vercel/callback";

              if (action === "callback") {
                const code = body.code;
                const redirectUri = body.redirect_uri || defaultRedirect;

                const tokenParams = new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  code,
                  redirect_uri: redirectUri,
                });

                const tokenRes = await fetch(
                  "https://api.vercel.com/v2/oauth/access_token",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: tokenParams.toString(),
                  }
                );

                const tokenJson = (await tokenRes.json().catch(() => ({}))) as any;
                if (!tokenRes.ok || !tokenJson.access_token) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        tokenJson.error_description ||
                        tokenJson.error ||
                        "Failed to exchange authorization token with Vercel API",
                    })
                  );
                  return;
                }

                const accessToken = String(tokenJson.access_token);
                const headers = {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                };

                // 1. Fetch User Profile
                const userRes = await fetch("https://api.vercel.com/v2/user", {
                  headers,
                });
                const userData = (await userRes.json().catch(() => ({}))) as any;
                const vercelUser = userData.user || userData;

                // 2. Fetch Projects
                let projects: any[] = [];
                try {
                  const projRes = await fetch(
                    "https://api.vercel.com/v9/projects?limit=20",
                    { headers }
                  );
                  if (projRes.ok) {
                    const projData = (await projRes.json().catch(() => ({}))) as any;
                    projects = Array.isArray(projData.projects)
                      ? projData.projects
                      : [];
                  }
                } catch (pErr) {
                  console.warn("[Vercel Dev Middleware] Projects fetch warning:", pErr);
                }

                // 3. Fetch Deployments
                let deployments: any[] = [];
                try {
                  const depRes = await fetch(
                    "https://api.vercel.com/v6/deployments?limit=10",
                    { headers }
                  );
                  if (depRes.ok) {
                    const depData = (await depRes.json().catch(() => ({}))) as any;
                    deployments = Array.isArray(depData.deployments)
                      ? depData.deployments
                      : [];
                  }
                } catch (dErr) {
                  console.warn("[Vercel Dev Middleware] Deployments fetch warning:", dErr);
                }

                const sanitizedProjects = projects.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  framework: p.framework || "other",
                  createdAt: p.createdAt,
                  updatedAt: p.updatedAt,
                  link: p.link
                    ? {
                        type: p.link.type,
                        repo: p.link.repo,
                        org: p.link.org,
                      }
                    : null,
                  targets: p.targets || null,
                  latestDeployments: Array.isArray(p.latestDeployments)
                    ? p.latestDeployments.slice(0, 2).map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        url: d.url ? `https://${d.url}` : null,
                        readyState: d.readyState || d.state,
                        createdAt: d.createdAt,
                      }))
                    : [],
                }));

                const sanitizedDeployments = deployments.map((d: any) => ({
                  uid: d.uid,
                  name: d.name,
                  url: d.url ? `https://${d.url}` : null,
                  state: d.state || d.readyState,
                  created: d.created || d.createdAt,
                  target: d.target || null,
                  inspectorUrl: d.inspectorUrl || null,
                }));

                const frameworksCount: Record<string, number> = {};
                sanitizedProjects.forEach((p: any) => {
                  const fw = p.framework || "vanilla";
                  frameworksCount[fw] = (frameworksCount[fw] || 0) + 1;
                });

                const topFrameworks = Object.entries(frameworksCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([framework, count]) => ({ framework, count }));

                const now = new Date().toISOString();
                const cachedData = {
                  totalProjects: sanitizedProjects.length,
                  totalDeployments: sanitizedDeployments.length,
                  projects: sanitizedProjects,
                  recentDeployments: sanitizedDeployments.slice(0, 5),
                  topFrameworks,
                  lastSynced: now,
                };

                const data = {
                  connected: true,
                  vercelUserId: String(vercelUser.id || "").trim(),
                  vercelUsername: String(vercelUser.username || "").trim(),
                  vercelName: String(
                    vercelUser.name || vercelUser.username || ""
                  ).trim(),
                  vercelEmail: vercelUser.email
                    ? String(vercelUser.email).trim()
                    : null,
                  vercelAvatarUrl: vercelUser.avatar
                    ? `https://vercel.com/api/www/avatar/${vercelUser.avatar}?s=160`
                    : null,
                  connectedAt: now,
                  lastSyncedAt: now,
                  cachedData,
                };

                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, data }));
                return;
              }

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  error: err?.message || "Internal dev server error",
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isSsl = mode === "ssl";
  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      allowedHosts: true,
      strictPort: false,
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react(),
      vercelOAuthDevPlugin(env),
      ...(isSsl ? [basicSsl()] : []),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        rollupOptions: {
          external: [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/status-bar',
            '@capacitor/push-notifications'
          ]
        }
      },
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Eduspace Learning Management System',
        short_name: 'Eduspace',
        description: 'A modern learning management system for students and lecturers',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'monochrome'
          }
        ]
      },
      devOptions: {
        enabled: false,
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    cssCodeSplit: true,
    // 🔐 Security: Strip all console.* and debugger statements in production
    // Prevents leaking user IDs, auth events, and internal info via DevTools
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            id.includes('pdfjs-dist') ||
            id.includes('jspdf') ||
            id.includes('jspdf-autotable') ||
            id.includes('html2canvas') ||
            id.includes('html-to-image') ||
            id.includes('xlsx')
          ) {
            return 'vendor-docs';
          }

          if (id.includes('three') || id.includes('react-force-graph-3d')) {
            return 'vendor-3d';
          }

          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }

          if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
            return 'vendor-data';
          }

          if (id.includes('framer-motion') || id.includes('/motion/') || id.includes('\\motion\\')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
};
});



