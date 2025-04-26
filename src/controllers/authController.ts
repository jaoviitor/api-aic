import { Request, Response } from 'express';
import { fetchAuthToken } from '../services/tokenService';

export const getToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { clientId, clientSecret } = req.body;

        if (!clientId || !clientSecret) {
            res.status(400).json({ 
                error: "Os campos 'client_id' e 'client_secret' são obrigatórios." 
            });
            return;
        }

        const tokenData = await fetchAuthToken(clientId, clientSecret);
        res.status(200).json(tokenData);
    } catch (error: any) {
        res.status(500).json({ 
            error: `Erro interno: ${error.message}` 
        });
    }
};