// Cloudflare Pages Function. Same route as api/score.js on Vercel.
import { forCloudflare } from '../../server/cloudflare.js';
import route from '../../server/routes/score.js';

export const onRequest = forCloudflare(route);
