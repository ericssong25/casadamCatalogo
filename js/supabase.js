/**
 * Casa Dam — Cliente Supabase
 */
(function () {
  var URL = 'https://hwbrihcnhzfdudyhdppm.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnJpaGNuaHpmZHVkeWhkcHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzIzMzEsImV4cCI6MjA5NTIwODMzMX0.4-OuRnEXjrkEi7Uf1HicrO_gcSSwu8Re0_7i5S_eTPE';

  try {
    window.supabaseClient = window.supabase.createClient(URL, KEY);
  } catch (e) {
    console.warn('Supabase no disponible:', e.message);
    window.supabaseClient = null;
  }
})();
