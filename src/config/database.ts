import { Pool } from "pg";
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

export const poolWrite = new Pool({
    user: process.env.DB_USER_WRITE,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD_WRITE,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function connectToHospitalDb(user, pass) {
    const pool = new Pool({
        user: user,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: pass,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false,
        },
    });

    return pool;
}

export const poolAiScribe = new Pool({
    user: process.env.DB_USER_WRITE,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE_AISCRIBE,
    password: process.env.DB_PASSWORD_WRITE,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

export const wudDb = new Pool({
    user: process.env.WUD_USER,
    host: process.env.WUD_HOST,
    database: 'wud_db',
    password: process.env.WUD_PASSWORD,
    port: process.env.WUD_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
})