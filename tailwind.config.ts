import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#367131',
          dark:    '#255226',
          mid:     '#4a8c45',
          light:   '#eaf3e8',
          pale:    '#f2f8f1',
        },
        amber: {
          DEFAULT: '#e07b0a',
          light:   '#fef3e6',
          mid:     '#f5a030',
        },
        charcoal: {
          DEFAULT: '#383838',
          light:   '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
