import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
import { postsPlugin } from './plugins/postsPlugin'

export default defineUserConfig({
  lang: 'en-US',
  title: "Bikram's Tech Journey",
  description: 'Technical notes and writings',

  // Preload fonts for faster LCP
  head: [
    ['link', { rel: 'preload', href: '/fonts/lora-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
    ['link', { rel: 'preload', href: '/fonts/lora-semibold.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
  ],

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
    postsPlugin(),
  ],
})
