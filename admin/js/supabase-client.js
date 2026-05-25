/**
 * Casa Dam Admin — Cliente Supabase
 * Usa el mismo patrón que el frontend público: IIFE + window.supabaseClient
 */
(function () {
  var URL = 'https://hwbrihcnhzfdudyhdppm.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnJpaGNuaHpmZHVkeWhkcHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzIzMzEsImV4cCI6MjA5NTIwODMzMX0.4-OuRnEXjrkEi7Uf1HicrO_gcSSwu8Re0_7i5S_eTPE';

  try {
    window.supabaseClient = window.supabase.createClient(URL, KEY);
    // Global shortcut for convenience (all admin JS files use 'supabase')
    window.supabase = window.supabaseClient;
  } catch (e) {
    console.warn('Supabase admin no disponible:', e.message);
    window.supabaseClient = null;
  }
})();