import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('DATABASE_URL host:', new URL(process.env.DATABASE_URL!).host);
  const rows = await sql`SELECT bulletin_id, effective_date::text, gasoline_czk, diesel_czk, imported_at::text FROM prices ORDER BY effective_date DESC`;
  console.log('row count:', rows.length);
  console.log(rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
