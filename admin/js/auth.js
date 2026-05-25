/**
 * Casa Dam Admin — Autenticación
 */

async function checkSession(redirect) {
  try {
    var _a = await window.supabaseClient.auth.getSession();
    if (!_a.data.session) {
      if (redirect !== false) window.location.href = 'login.html';
      return null;
    }
    return _a.data.session;
  } catch (e) {
    if (redirect !== false) window.location.href = 'login.html';
    return null;
  }
}

async function login(email, password) {
  try {
    var _a = await window.supabaseClient.auth.signInWithPassword({ email: email, password: password });
    return { data: _a.data, error: null };
  } catch (e) {
    return { data: null, error: { message: 'Error de conexión, intenta de nuevo' } };
  }
}

async function signOut() {
  await window.supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}
