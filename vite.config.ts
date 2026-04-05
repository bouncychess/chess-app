import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // To use local chessground source, uncomment the following (requires `import path from 'path'`):
  // resolve: {
  //   alias: [
  //     { find: '@lichess-org/chessground/assets', replacement: path.resolve(__dirname, '../chessground/assets') },
  //     { find: /^@lichess-org\/chessground\/(.+)$/, replacement: path.resolve(__dirname, '../chessground/src/$1.ts') },
  //     { find: '@lichess-org/chessground', replacement: path.resolve(__dirname, '../chessground/src/chessground.ts') },
  //   ],
  // },
})
