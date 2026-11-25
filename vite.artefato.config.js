import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Build de arquivo único para virar artefato do Claude (veja montar-artefato.cjs).
export default defineConfig({ plugins: [react()], build: { outDir: 'dist-art', cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } } });
