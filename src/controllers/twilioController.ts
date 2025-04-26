import { Request, Response } from 'express';
import { generateToken, createVoiceResponse } from '../services/twilioService';

export const getToken = (req: Request, res: Response) => {
    try {
      const identity = req.query.identity as string;
      const token = generateToken(identity);
      res.status(200).json(token);
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      res.status(500).json({ error: 'Erro ao gerar token' });
    }
  };

  export const handleVoice = (req: Request, res: Response) => {
    try {
      const twimlResponse = createVoiceResponse(req.body);
      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
    } catch (error) {
      console.error('Erro ao processar requisição de voz:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };