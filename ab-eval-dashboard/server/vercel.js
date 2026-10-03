// Vercel adapter: wraps a host-neutral route as a Node serverless function.
import { run } from './providers.js';

export function forVercel(fn) {
  return async (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        res.status(400).json({ error: 'Request body was not valid JSON.' });
        return;
      }
    }
    const out = await run(fn, {
      method: req.method,
      body,
      key: req.headers['x-provider-key'],
      env: process.env,
    });
    res.status(out.status).json(out.json);
  };
}
