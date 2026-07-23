// ============================================
// SocialVerse - Configuration
// Replace with your Supabase credentials
// ============================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Validate config
if (!window.supabase) {
  document.getElementById('app').innerHTML = `<div class="config-error"><h1>🌐 SocialVerse</h1><p>Supabase SDK failed to load. Run from a local server:</p><code>python3 -m http.server 3000</code></div>`;
  throw new Error('SDK not loaded');
}
if (SUPABASE_URL.includes('YOUR_')) {
  document.getElementById('app').innerHTML = `<div class="config-error"><h1>🌐 SocialVerse</h1><p>Configure your Supabase credentials in <code>js/modules/config.js</code></p><pre>const SUPABASE_URL = 'https://xxx.supabase.co';\nconst SUPABASE_ANON_KEY = 'your-key';</pre><p>Get them from: Supabase Dashboard → Settings → API</p></div>`;
  throw new Error('Not configured');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
