// Vercel function. The route itself lives in server/routes/score.js so the
// same code also runs on Cloudflare Pages (functions/api/score.js).
import { forVercel } from '../server/vercel.js';
import route from '../server/routes/score.js';

export default forVercel(route);
