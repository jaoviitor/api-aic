import { Request, Response } from 'express';
import { getStatisticsData } from "../services/statisticsService";

export const getStatisticsCirurgias = async (req: Request, res: Response): Promise<void> => {
    const user = req.headers['db-user'] as string;
    const pass = req.headers['db-pass'] as string;

    if (!user || !pass) {
        res.status(400).json({ error: "Missing database credentials" });
        return;
    }

    try {
        const statisticsData = await getStatisticsData(user, pass);
        
        res.status(200)
           .header("Content-Type", "application/json")
           .json(statisticsData);
    } catch (error: any) {
        res.status(500).json({
            error: `Erro ao buscar estatísticas: ${error.message}`,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};