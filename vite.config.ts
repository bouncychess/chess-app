import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: mode === 'development' ? [
      // Local dev: use local chessground source directly
      { find: '@lichess-org/chessground/assets', replacement: path.resolve(__dirname, '../chessground/assets') },
      { find: /^@lichess-org\/chessground\/(.+)$/, replacement: path.resolve(__dirname, '../chessground/src/$1.ts') },
      { find: '@lichess-org/chessground', replacement: path.resolve(__dirname, '../chessground/src/chessground.ts') },
    ] : [],
  },
}))
