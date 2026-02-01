import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL =
  "https://obtwaplzyawlvnnocsbk.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_jDjhdzFZ8u4quk2uCmTavw_F5QGXp2-";

const envPath = path.join(process.cwd(), ".env.local");
const required = {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
};

const existing = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf-8").split(/\r?\n/)
  : [];

const lines = existing.filter((line) => line.trim().length > 0);
const updated = [];
const seen = new Set();

for (const line of lines) {
  const [key, ...rest] = line.split("=");
  if (key in required) {
    updated.push(`${key}=${required[key]}`);
    seen.add(key);
  } else {
    updated.push(line);
  }
}

for (const [key, value] of Object.entries(required)) {
  if (!seen.has(key)) {
    updated.push(`${key}=${value}`);
  }
}

fs.writeFileSync(envPath, `${updated.join("\n")}\n`, "utf-8");

console.log("Supabase env updated in .env.local.");
console.log("Restart the dev server after running: npm run dev");
