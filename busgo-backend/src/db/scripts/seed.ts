/** npm run db:seed: adds any missing starter data. */
import { seed } from '../seed.js';
import { withScriptDb } from './script-db.js';

await withScriptDb(seed);
