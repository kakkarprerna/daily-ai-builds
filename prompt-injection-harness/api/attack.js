// Vercel function. The route itself lives in server/routes/attack.js so the
// same code also runs on Cloudflare Pages (functions/api/attack.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/attack.js';

export default forVercel(route);
