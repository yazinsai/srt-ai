import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'hero-pattern': 'radial-gradient(50% 50% at 50% 50%, rgba(47, 234, 81, 0.15) 0%, rgba(47, 234, 81, 0.00) 80.21%)'
      }
    },
  },
  plugins: [],
}
export default config
