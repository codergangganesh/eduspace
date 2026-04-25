import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
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
}));
