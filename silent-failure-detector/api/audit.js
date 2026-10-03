// Vercel function. The route itself lives in server/routes/audit.js so the
// same code also runs on Cloudflare Pages (functions/api/audit.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/audit.js';

export default forVercel(route);
