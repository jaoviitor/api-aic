import { Request, Response } from 'express';
import axios from 'axios';

export const convertAudio = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        const audioUrl = body.audioUrl;

        if (!audioUrl) {
            res.status(400).json({ error: 'O campo "audioUrl" é obrigatório.' });
            return;
        }

        const response = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 300000 });
        const audioBase64 = Buffer.from(response.data).toString('base64');

        res.status(200).json({ base64: audioBase64 });
    } catch (error) {
        console.error('Erro ao converter o áudio:', error);
        res.status(500).json({ error: 'Erro ao converter o áudio para Base64.' });
    }
};