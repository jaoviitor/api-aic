import { Request, Response } from 'express';
import { getUserConversations } from "../services/wudService";

export const getConversations = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;

    if (!userId || isNaN(Number(userId))) {
        res.status(400).json({ 
            error: "Parâmetro 'userId' é obrigatório e deve ser um número válido." 
        });
        return;
    }

    try {
        const conversations = await getUserConversations(Number(userId));
        
        res.status(200).json(conversations);
    } catch (error: any) {
        console.error(`Erro ao buscar conversas: ${error.message}`);
        res.status(500).json({ 
            error: "Erro interno ao buscar conversas." 
        });
    }
};