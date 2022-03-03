import { defineConfig } from 'windicss/helpers'
import plugin from 'windicss/plugin'

export default defineConfig({
  plugins: [
    plugin(({ addUtilities }) => {
      const newUtilities = {
        '.drag': {
          '-webkit-app-region': 'drag;',
        },
        '.no-drag': {
          '-webkit-app-region': 'no-drag;',
        },
      }
      addUtilities(newUtilities)
    }),
  ],
})
