import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Project root = parent of this script's directory (supabase/ -> project root),
// so the script works no matter which directory it is launched from.
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Minimal dotenv-style loader. The root .env.local is not loaded automatically
 * when running a standalone script with tsx (only Next.js loads it), so this
 * populates process.env for any key that is not already defined.
 */
function loadEnvFile(filePath: string) {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // Strip surrounding double quotes and unescape common sequences.
        if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
            value = value.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));

const CONNECTION_STRING = process.env.POSTGRES_URL_NON_POOLING;

if (!CONNECTION_STRING) {
    throw new Error('Missing POSTGRES_URL_NON_POOLING environment variable.');
}

// Capture the value after the guard so its type is `string` below: TypeScript
// does not carry the narrowing of a const into the body of a (hoisted) function
// declaration, so referencing CONNECTION_STRING inside applySchema() would
// still be `string | undefined`.
const DATABASE_URL = CONNECTION_STRING;

async function applySchema() {
    // pg 8.x maps `sslmode=require` to `verify-full`, which validates the cert
    // chain and rejects Supabase's pooler certificate. Strip it so the explicit
    // `ssl: { rejectUnauthorized: false }` option below takes effect (TLS is
    // still used, it just doesn't verify the chain — fine for this dev script).
    const [base, query = ''] = DATABASE_URL.split('?');
    const params = query.split('&').filter((p) => p && !p.startsWith('sslmode='));
    const connectionString = params.length ? `${base}?${params.join('&')}` : base;

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false // Richiesto per connettersi in sicurezza a Supabase
        }
    });

    try {
        console.log('⏳ Connessione a Supabase in corso...');
        await client.connect();
        console.log('✅ Connessione riuscita!');

        // Legge il file schema.sql locale
        const schemaPath = path.join(__dirname, 'schema.sql');
        console.log(`📖 Lettura del file: ${schemaPath}`);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Esecuzione dello schema.sql sul database...');
        await client.query(sql);

        console.log('🎉 Tutto aggiornato con successo! Le modifiche e le funzioni sono attive.');
    } catch (error) {
        console.error('❌ Errore durante l\'aggiornamento del database:', error);
    } finally {
        await client.end();
    }
}

applySchema();