// One-time schema bootstrap. Run locally against the prod DB:
//
//   POSTGRES_URL=... npm run db:migrate
//
// Idempotent — safe to re-run.
import { ensureSchema } from '../src/lib/db';

ensureSchema()
  .then(() => {
    console.log('schema ensured');
    process.exit(0);
  })
  .catch((err) => {
    console.error('migration failed:', err);
    process.exit(1);
  });
