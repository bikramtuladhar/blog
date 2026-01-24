import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'

export default defineUserConfig({
  lang: 'en-US',
  title: "Bikram's Tech Journey",
  description: 'Technical notes and writings',

  bundler: viteBundler(),

  theme: defaultTheme({
    logo: false,
    navbar: false,
    sidebar: false,
    editLink: false,
    lastUpdated: false,
    contributors: false,
    colorModeSwitch: true,
    colorMode: 'light',
  }),

  plugins: [
    googleAnalyticsPlugin({
      id: 'G-VZ3VDPJNR0',
    }),
  ],
})
