// Loads .env.local for standalone scripts (tsx), which — unlike `next dev` —
// does not read env files on its own. Must be imported before any module that
// reads process.env at import time (e.g. ../lib/mongodb).
import { config } from 'dotenv';

config({ path: '.env.local' });
