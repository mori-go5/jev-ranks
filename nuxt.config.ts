export default defineNuxtConfig({
  compatibilityDate: '2026-09-28',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/eslint'],
  eslint: {
    config: {
      stylistic: false,
    },
  },
  nitro: {
    timing: false,
  },
  app: {
    head: {
      title: 'Jev Ranks',
      meta: [
        {
          name: 'description',
          content: '好きなテーマで、Jevがいろいろランキング。',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Jev Ranks' },
        { property: 'og:description', content: '好きなテーマで、Jevがいろいろランキング。' },
        { property: 'og:image', content: 'https://jev-ranks.vercel.app/og-image.png' },
        { property: 'og:url', content: 'https://jev-ranks.vercel.app/' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Jev Ranks' },
        { name: 'twitter:description', content: '好きなテーマで、Jevがいろいろランキング。' },
        { name: 'twitter:image', content: 'https://jev-ranks.vercel.app/og-image.png' },
        { name: 'theme-color', content: '#f6f4ed' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://jev-ranks.vercel.app/' },
      ],
    },
  },
  routeRules: {
    '/**': {
      headers: {
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      },
    },
  },
})
