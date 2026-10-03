// Cloudflare Pages Function. Same route as api/estimate.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/estimate.js';

export const onRequest = forCloudflare(route);
