import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const CONNECTION_STRING = process.env.POSTGRES_URL_NON_POOLING;

if (!CONNECTION_STRING) {
    throw new Error('Missing POSTGRES_URL_NON_POOLING environment variable.');
}

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