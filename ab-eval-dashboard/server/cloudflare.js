// Cloudflare Pages adapter: wraps a host-neutral route as a Pages Function.
// Environment variables set in the Cloudflare dashboard arrive on context.env.
import { run } from './providers.js';

export function forCloudflare(fn) {
  return async ({ request, env }) => {
    let body = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Request body was not valid JSON.' }, { status: 400 });
      }
    }
    const out = await run(fn, {
      method: request.method,
      body,
      key: request.headers.get('x-provider-key'),
      env,
    });
    return Response.json(out.json, { status: out.status });
  };
}
