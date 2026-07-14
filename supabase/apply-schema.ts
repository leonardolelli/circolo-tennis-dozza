import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Sostituisci questa stringa con la tua Connection String URI reale di Supabase
const CONNECTION_STRING = "postgres://postgres.ddczswbmbvztedusqbcl:E9UeWl8upiu6vyIv@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

async function applySchema() {
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: {
            rejectUnauthorized: false // Richiesto per connettersi in sicurezza a Supabase
        }
    });

    try {
        console.log('⏳ Connessione a Supabase in corso...');
        await client.connect();
        console.log('✅ Connessione riuscita!');

        // Legge il file schema.sql locale
        const schemaPath = path.join(process.cwd(), 'schema.sql');
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