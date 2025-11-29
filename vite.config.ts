import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // The user provided key, strictly trimmed to remove accidental whitespace.
  const API_KEY = "AIzaSyD0lwGqC7a5RjyK-p4tnDB27lIRc6FPL0so";

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY to be replaced by the string literal of the key during build.
      // This ensures the key is embedded in the browser bundle.
      'process.env.API_KEY': JSON.stringify(API_KEY)
    }
  };
});