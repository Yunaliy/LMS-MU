import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  // optimizeDeps: {
  //   include: ["@chapa_et/inline.js"], // Force Vite to include the package
  // },
})



