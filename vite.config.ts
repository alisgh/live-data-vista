import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const PLC_IP = 'http://192.168.0.213'; // 👈 Set your PLC IP once here (controller IP changed to 192.168.0.213)

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/getvar.csv': {
        target: PLC_IP,
        changeOrigin: true,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.log('PLC proxy error:', err.message);
            console.log('Target URL:', `${PLC_IP}${req.url}`);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to PLC:', req.method, `${PLC_IP}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from PLC:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/setvar.csv': {
        target: PLC_IP,
        changeOrigin: true,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.log('PLC proxy error:', err.message);
            console.log('Target URL:', `${PLC_IP}${req.url}`);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to PLC:', req.method, `${PLC_IP}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from PLC:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Proxy API requests to the local backend during development so '/api/*' returns JSON from server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.log('API proxy error:', err.message, req.url);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
