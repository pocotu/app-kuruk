// @ts-check
import { defineConfig } from 'astro/config';

import db from '@astrojs/db';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [db()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel()
});