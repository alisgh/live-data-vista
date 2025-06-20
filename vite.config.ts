
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/getvar.csv': {
        target: 'http://192.168.0.213',
        changeOrigin: true,
        timeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('PLC proxy error:', err.message);
            console.log('Target URL:', `http://192.168.0.213${req.url}`);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to PLC:', req.method, `http://192.168.0.213${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from PLC:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/setvar.csv': {
        target: 'http://192.168.0.213',
        changeOrigin: true,
        timeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('PLC proxy error:', err.message);
            console.log('Target URL:', `http://192.168.0.213${req.url}`);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to PLC:', req.method, `http://192.168.0.213${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from PLC:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
