/* Sum-IT site config — editable without touching the site code.
   API_BASE: '' means same origin (Cloudflare Pages Functions under /api/*).
   socials: leave a URL empty ('') to HIDE that icon on the site.
   fallbackClaimed: shown when the stats API is not reachable yet.
   displayOffsetNote: the real offset lives server-side (env DISPLAY_OFFSET). */
window.SITE_CFG = {
  API_BASE: '',
  PORTAL_URL: '/portal.html',
  socials: {
    linkedin: '',
    instagram: '',
    x: ''
  },
  fallbackClaimed: 143
};
