import { poolWrite } from "../config/database";
import { Pool } from "pg";
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

function generateRandomPassword(length = 15) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const createDatabaseForHospital = async (hospitalName) => {
    const dbName = `${hospitalName}_db`;
    const readonlyUser = `${hospitalName}_readonly`;
    const readonlyPassword = generateRandomPassword();

    const killConnectionsQuery = `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'vital_template_db'
    AND pid <> pg_backend_pid(); -- não mata a própria sessão
    `;

    const createDbQuery = `
    CREATE DATABASE ${dbName} WITH TEMPLATE vital_template_db OWNER aicadmin;
    `;

    const createUserQuery = `
    CREATE USER ${readonlyUser} WITH PASSWORD '${readonlyPassword}';
    SECURITY LABEL FOR anon ON ROLE ${readonlyUser} IS 'MASKED';
    GRANT CONNECT ON DATABASE ${dbName} TO ${readonlyUser};
    GRANT USAGE ON SCHEMA public TO ${readonlyUser};
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${readonlyUser};
    `;

    try {
        const client = await poolWrite.connect();

        await client.query(killConnectionsQuery);
        await client.query(createDbQuery);

        console.log(`Banco de dados ${dbName} criado com sucesso!`);
        client.release();

        const hospitalDbPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER_WRITE,
            password: process.env.DB_PASSWORD_WRITE,
            database: dbName,
        });

        const hospitalClient = await hospitalDbPool.connect();
        await hospitalClient.query(createUserQuery);
        hospitalClient.release();

        const supabase = createClient(supabaseUrl, supabaseKey);

        
        const { data, error } = await supabase
        .from('hospital')
        .insert([
            { nome: hospitalName, dbUser: readonlyUser, dbPass: readonlyPassword },
        ])
        .select()
        if (error) {
            console.error(`Erro ao inserir novo hospital: ${error.message}`);
            throw new Error('Não foi possível inserir o novo hospital');
        }


    } catch (error) {
        console.error("Erro ao criar banco de dados:", error);
    } finally {
        await poolWrite.end();
    }
};