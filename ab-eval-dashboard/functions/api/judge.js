// Cloudflare Pages Function. Same route as api/judge.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/judge.js';

export const onRequest = forCloudflare(route);
