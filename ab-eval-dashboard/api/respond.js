// Vercel function. The route itself lives in server/routes/respond.js so the
// same code also runs on Cloudflare Pages (functions/api/respond.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/respond.js';

export default forVercel(route);
