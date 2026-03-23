import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true // set to true to listen on all addresses, including LAN and public addresses
    // You can also use '0.0.0.0' explicitly if 'true' doesn't work in some environments
  },
  plugins: [tailwindcss(),react()],
})
