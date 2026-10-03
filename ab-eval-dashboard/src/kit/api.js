// Calls this site's own server function. The visitor's key, when they use
// one, travels in a header for that single request and is never stored.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function callApi(path, body, settings, attempt = 1) {
  const headers = { 'Content-Type': 'application/json' };
  if (settings.provider !== 'glimmer') headers['x-provider-key'] = settings.key;
  let r;
  try {
    r = await fetch(`/api/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, provider: settings.provider, model: settings.model }),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let j = {};
  try {
    j = await r.json();
  } catch {
    /* non-JSON error page */
  }
  if (!r.ok) {
    if ([429, 502, 503, 504, 529].includes(r.status) && attempt < 3 && !/not set up/.test(j.error || '')) {
      await sleep(attempt * 1500);
      return callApi(path, body, settings, attempt + 1);
    }
    if (r.status === 404) throw new Error('The server function was not found. Run the app with "npx vercel dev" or "npx wrangler pages dev" rather than "npm run dev".');
    throw new Error(j.error || `Request failed (${r.status}).`);
  }
  return j;
}

export { sleep };
