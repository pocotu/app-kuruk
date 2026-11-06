// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://app-kuruk.vercel.app',
  output: 'server',

  env: {
    schema: {
      API_URL: envField.string({ context: 'server', access: 'secret', url: true }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // No vigilar la salida del build: solo genera ruido y consume vigilantes de archivos.
    server: { watch: { ignored: ['**/.vercel/**', '**/dist/**'] } }
  },

  adapter: vercel()
});
