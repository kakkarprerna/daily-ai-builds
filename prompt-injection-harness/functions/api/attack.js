// Cloudflare Pages Function. Same route as api/attack.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/attack.js';

export const onRequest = forCloudflare(route);
