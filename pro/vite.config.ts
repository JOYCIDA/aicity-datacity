import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173 : celui que le backend autorise déjà (CORS_ORIGINS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
