// One-off: run a SQL file against the project via the Supabase Management API.
// Usage: node scripts/run-migration.mjs <path-to-sql> (token from SUPABASE_ACCESS_TOKEN)
import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "xuxzujerrnkjivmuaoxf";
const sql = readFileSync(process.argv[2], "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
console.log(res.status, text.slice(0, 2000));
process.exit(res.ok ? 0 : 1);
