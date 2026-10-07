/**
 * Authenticated client for the Mercado Livre API.
 *
 * Since 2025 the public endpoints (/items, /products) reject anonymous calls
 * with 401/403, so every request carries an application token obtained with
 * the client_credentials grant (MELI_CLIENT_ID / MELI_CLIENT_SECRET).
 * Server-side only: the secret must never reach the browser.
 */

const API_BASE = 'https://api.mercadolibre.com';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Integração com o Mercado Livre não configurada. Defina MELI_CLIENT_ID e MELI_CLIENT_SECRET no servidor.'
    );
  }

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[MercadoLivre] Falha ao obter token:', res.status, detail.slice(0, 300));
    throw new Error(
      'Não foi possível autenticar no Mercado Livre. Verifique MELI_CLIENT_ID e MELI_CLIENT_SECRET.'
    );
  }

  const data = await res.json();
  const expiresInMs = (Number(data.expires_in) || 21600) * 1000;
  // Renew one minute early to avoid using a token that expires mid-request
  cachedToken = { value: data.access_token, expiresAt: Date.now() + expiresInMs - 60_000 };
  return cachedToken.value;
}

/**
 * GET a Mercado Livre API path (e.g. `/items/MLB123`) with the app token.
 * Retries once with a fresh token if the cached one was rejected.
 */
export async function meliFetch(path: string): Promise<Response> {
  const doFetch = async (token: string) =>
    fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'TECH7-Electronics-Importer/1.0',
      },
    });

  let res = await doFetch(await getAccessToken());
  if (res.status === 401) {
    res = await doFetch(await getAccessToken(true));
  }
  return res;
}
