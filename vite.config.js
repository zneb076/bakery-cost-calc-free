import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/bakery-cost-calc-free/', // แก้ไขให้ตรงกับ repository ของคุณ
  plugins: [
    vue(),
    VueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'ขออีกคำ - Bakery Cost Calculator',
        short_name: 'Bakery Cost Calc (ขออีกคำ)',
        description: 'แอปพลิเคชันสำหรับช่วยคิดต้นทุนสูตรขนม',
        theme_color: '#ff7081',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
