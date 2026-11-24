import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// A IA roda no server.js (porta 3000); o proxy mantém a chave fora do navegador.
export default defineConfig({ plugins: [react()], server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } } });
