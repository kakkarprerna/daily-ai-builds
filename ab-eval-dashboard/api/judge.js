// Vercel function. The route itself lives in server/routes/judge.js so the
// same code also runs on Cloudflare Pages (functions/api/judge.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/judge.js';

export default forVercel(route);
