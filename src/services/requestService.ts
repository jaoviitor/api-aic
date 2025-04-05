import { poolWrite } from "../config/database";

export async function getRequests() {
    try {
        const result = await poolWrite.query(`
            SELECT * FROM HC.Requests
            `);
        return result.rows;
    } catch (error) {
        throw new Error(`Error accessing database: ${error.message}`);
    }
}

export async function getGeral() {
    try {
        const result = await poolWrite.query(`
            SELECT * FROM HC.Geral
            `);
        return result.rows;
    } catch (error) {
        throw new Error(`Error accessing database: ${error.message}`);
    }
}
