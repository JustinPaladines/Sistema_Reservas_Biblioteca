import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Desactiva el motor Rolldown y fuerza el uso de Rollup clásico
    rollupOptions: {
      // Definimos explícitamente el punto de entrada
      input: './index.html',
    },
    // Desactiva la resolución agresiva de módulos que causa el ciclo
    minify: false, 
  },
  // Bloquea el acceso a archivos fuera de la carpeta actual
  server: {
    fs: {
      strict: true,
    }
  }
})