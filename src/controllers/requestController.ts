import { Request, Response } from 'express';
import { getRequests, getGeral } from "../services/requestService";

export const getRequestsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const requests = await getRequests();
        res.status(200).json(requests);
    } catch (error: any) {
        res.status(500).json({
            error: "Error when searching for requests",
            message: error.message
        });
    }
};


export const getGeralHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const geral = await getGeral();
        res.status(200).json(geral);
    } catch (error: any) {
        res.status(500).json({
            error: "Error when searching for general data",
            message: error.message
        });
    }
};