// Petit client HTTP : ajoute le token et gère les erreurs de façon uniforme
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const token = localStorage.getItem('token');
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Serveur injoignable. Vérifiez que le backend est démarré.');
  }

  if (raw && res.ok) return res;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* réponse sans JSON */
  }

  if (!res.ok) {
    // Token expiré : on déconnecte (sauf pendant la connexion elle-même)
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    const error = new Error(data?.error || `Erreur ${res.status}`);
    error.status = res.status;
    error.fields = data?.errors;
    throw error;
  }
  return data;
}
