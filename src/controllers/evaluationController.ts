import { Request, Response } from 'express';
import { getEvaluations } from "../services/evaluationService";

export const getEvaluation = async (req: Request, res: Response): Promise<void> => {
    const user = req.headers['db-user'] as string;
    const pass = req.headers['db-pass'] as string;

    if (!user || !pass) {
        res.status(400).json({ error: "Missing database credentials" });
        return;
    }

    try {
        const result = await getEvaluations(user, pass);
        
        res.status(200)
           .json(result);
    } catch (error: any) {
        res.status(500).json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};