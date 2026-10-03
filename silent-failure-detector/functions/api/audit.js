// Cloudflare Pages Function. Same route as api/audit.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/audit.js';

export const onRequest = forCloudflare(route);
