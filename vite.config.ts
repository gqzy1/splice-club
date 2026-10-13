import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'/splice-club/',test:{environment:'jsdom',include:['tests/**/*.test.{ts,tsx}']},build:{rollupOptions:{output:{manualChunks:{sdk:['genlayer-js']}}}}});
