// config.js — NETLEARN CN App
// ⚠️  DO NOT commit this file if it contains a real API key.
//      For local development: copy .env.example → .env and add your key.
//      For cloud deployment (GitHub Pages): the key is injected by
//      GitHub Actions from repository Secrets → no .env needed in the repo.

const CONFIG = {
  // __GEMINI_API_KEY__ is replaced at build time by the GitHub Actions
  // deploy workflow using the GEMINI_API_KEY repository secret.
  // Locally, you can set window.GEMINI_API_KEY before this script loads
  // OR edit the fallback string below (never commit a real key!).
  GEMINI_API_KEY: (function () {
    // 1. Build-time injection (GitHub Actions replaces the placeholder string)
    const injected = '__GEMINI_API_KEY__';
    if (injected && !injected.startsWith('__')) return injected;

    // 2. Runtime global (useful for MIT App Inventor passing key via JS bridge)
    if (typeof window !== 'undefined' && window.GEMINI_API_KEY) return window.GEMINI_API_KEY;

    // 3. Fallback — empty string (app will show "API key missing" error gracefully)
    return '';
  })(),

  // Set to true to route all Gemini calls through your Vercel proxy instead
  USE_PROXY: false,
  PROXY_URL: 'https://your-project.vercel.app/api/gemini',

  GEMINI_MODEL: 'gemini-1.5-flash',
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',

  get GEMINI_ENDPOINT() {
    if (this.USE_PROXY) return this.PROXY_URL;
    return `${this.GEMINI_BASE_URL}/${this.GEMINI_MODEL}:generateContent?key=${this.GEMINI_API_KEY}`;
  }
};
