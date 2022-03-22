import reactRefresh from '@vitejs/plugin-react-refresh'
import { build } from 'vite'

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
  plugins: [reactRefresh()],
  server: {
    host: '0.0.0.0',
    hmr: {
      port: 443,
    }
  },
  build: {
    outDir : "build",
  }
}
