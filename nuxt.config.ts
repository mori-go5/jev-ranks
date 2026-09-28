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
          content: '身近なものをJevがまとめて評価。題材とテーマを選ぶだけで、AIランキングを作ろう。',
        },
        { name: 'theme-color', content: '#f6f4ed' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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
