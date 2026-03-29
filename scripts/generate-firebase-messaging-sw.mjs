/**
 * Writes public/firebase-messaging-sw.js from scripts/firebase-messaging-sw.template.js
 * using Vite env loading (.env, .env.local, .env.[mode], etc.).
 *
 * Usage: node scripts/generate-firebase-messaging-sw.mjs [development|production]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const mode = process.argv[2] === 'production' ? 'production' : 'development';
const env = loadEnv(mode, root, '');

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = REQUIRED.filter((k) => !String(env[k] ?? '').trim());
if (missing.length) {
  console.error(
    '[generate-firebase-messaging-sw] Missing required env vars:\n  ',
    missing.join(', '),
    '\nCopy .env.example → .env and set Firebase Web app config from the Firebase console.',
  );
  process.exit(1);
}

const templatePath = resolve(__dirname, 'firebase-messaging-sw.template.js');
let out = readFileSync(templatePath, 'utf8');

const REPLACE_KEYS = [...REQUIRED, 'VITE_FIREBASE_MEASUREMENT_ID'];
for (const key of REPLACE_KEYS) {
  const val = key === 'VITE_FIREBASE_MEASUREMENT_ID' ? String(env[key] ?? '').trim() : String(env[key]).trim();
  out = out.split(`%%${key}%%`).join(val);
}

const outDir = resolve(root, 'public');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'firebase-messaging-sw.js');
writeFileSync(outPath, out, 'utf8');
console.log('[generate-firebase-messaging-sw] Wrote', outPath);
