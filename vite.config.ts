import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Explicitly define the API key. 
      // It prioritizes the Vercel/System Env Var, then falls back to the hardcoded key.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "AIzaSyD0lwGqC7a5RjyK-p4tnDB27lIRc6FPL0so"),
      // Polyfill process.env for other usages (like Firebase config)
      'process.env': JSON.stringify(env)
    }
  };
});