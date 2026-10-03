// Cloudflare Pages Function. Same route as api/respond.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/respond.js';

export const onRequest = forCloudflare(route);
