import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Function to inject headers after build
function injectHeaders() {
  return {
    name: 'inject-headers',
    closeBundle() {
      const distPath = path.resolve(__dirname, 'dist', '_headers');
      const headersContent = `
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Access-Control-Allow-Origin: *
`;
      fs.writeFileSync(distPath, headersContent);
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectHeaders() // Plugin to add headers after build
  ]
});
