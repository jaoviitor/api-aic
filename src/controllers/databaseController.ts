import { Request, Response } from 'express';
import { createDatabaseForHospital } from '../services/databaseService';

export const createHospital = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        const nameHospital = body.nameHospital;

        if (!nameHospital) {
            res.status(400).json({ error: 'O campo "nameHospital" é obrigatório.' });
            return;
        }
        const result = await createDatabaseForHospital(nameHospital);
        res.status(201).json({
            message: `Database ${nameHospital}_db criado com sucesso!`,
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};