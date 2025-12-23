import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production'
    ? (process.env.VITE_BASE_PATH || '/emergency-supply-tracker/')
    : '/',
})
