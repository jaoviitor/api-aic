import { Pool } from "pg";
import { connectToHospitalDb } from "../config/database";

export async function getEvaluations(user: string, pass: string) {
    let pool: Pool | null = null;

    try{
        pool = await connectToHospitalDb(user, pass);
        const result = await pool.query(`SELECT * FROM PUBLIC.evaluation`);
        return result.rows;
    } catch (error) {
        throw new Error(`Error accessing database: ${error.message}`);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}