// Vercel function. The route itself lives in server/routes/estimate.js so the
// same code also runs on Cloudflare Pages (functions/api/estimate.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/estimate.js';

export default forVercel(route);
