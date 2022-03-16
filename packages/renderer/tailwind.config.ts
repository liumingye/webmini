import { defineConfig } from 'windicss/helpers'
import plugin from 'windicss/plugin'

export default defineConfig({
  theme: {
    screens: {
      '3sm': { max: '350px' },
      '2sm': { min: '350px', max: '640px' },
      sm: { min: '640px', max: '768px' },
      md: { min: '768px', max: '1024px' },
      lg: { min: '1024px', max: '1280px' },
      xl: { min: '1280px', max: '1536px' },
      '2xl': { min: '1536px' },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      const newUtilities = {
        '.drag': {
          '-webkit-app-region': 'drag',
        },
        '.no-drag': {
          '-webkit-app-region': 'no-drag',
        },
      }
      addUtilities(newUtilities)
    }),
  ],
})
