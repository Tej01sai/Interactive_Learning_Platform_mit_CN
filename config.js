// ⚠️ DO NOT commit your .env file to a public repository

const CONFIG = {
  // Loaded from an env-injected global or build-time env var.
  GEMINI_API_KEY:
    (typeof window !== 'undefined' && window.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
    '',

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
