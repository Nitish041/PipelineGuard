import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:3001' } }, test: { environment: 'jsdom', setupFiles: './src/test-setup.ts', coverage: { provider: 'v8', reporter: ['text', 'lcov'], reportsDirectory: 'coverage', include: ['src/**/*.{ts,tsx}'], exclude: ['src/main.tsx', 'src/test-setup.ts'] } } });
