import { Request, Response } from 'express';
import { getMeetingsWithDetails, getMeetingsLeadsVenda, transcribeAudioFromBlob, transcribeVideoFromUrlVideo, getTranscriptFromRecall } from '../services/aiscribeService';
import { downloadAudioFile } from '../services/audioService';

export const getMeetings = async (req: Request, res: Response): Promise<void> => {
    try {
        const meetings = await getMeetingsWithDetails();
        res.status(200).json(meetings);
    } catch (error: any) {
        res.status(500).json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getMeetingsVendas = async (req: Request, res: Response): Promise<void> => {
    try {
        const meetingsVendas = await getMeetingsLeadsVenda();
        res.status(200).json(meetingsVendas);
    } catch (error: any) {
        res.status(500).json({
            error: "Internal Server Error", 
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const convertAudioToBase64 = async (req: Request, res: Response) => {
    const { fileName } = req.body;

    if (!fileName) {
        return res.status(400).json({ error: 'O campo "fileName" é obrigatório.' });
    }

    try {
        const audioBuffer = await downloadAudioFile(fileName);
        const audioBase64 = audioBuffer.toString("base64");

        return res.status(200).json({ base64: audioBase64 });
    } catch (error: any) {
        console.error("Erro ao converter o áudio:", error);
        return res.status(500).json({ error: error.message || 'Erro interno ao processar o áudio.' });
    }
};

export const handleSpeechTranscription = async (req: Request, res: Response) => {
    const { fileName } = req.params;

    try {
        const text = await transcribeAudioFromBlob(fileName);
        return res.status(200).json({ text });
    } catch (error) {
        console.error("Erro na transcrição:", error);
        return res.status(500).json({ error: "Erro ao transcrever o áudio." });
    }
};

export const handleSpeechTranscriptionFromVideo = async (req: Request, res: Response) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'O campo "videoUrl" é obrigatório.' });
    }

    try {
        const text = await transcribeVideoFromUrlVideo(videoUrl);
        return res.status(200).json({ text });
    } catch (error) {
        console.error("Erro na transcrição:", error);
        return res.status(500).json({ error: "Erro ao transcrever o áudio." });
    }
};

export const getTranscriptController = async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      
      if (!botId) {
        return res.status(400).json({ error: 'Bot ID é obrigatório' });
      }
      
      const transcript = await getTranscriptFromRecall(botId);
      
      res.json({ transcript });
    } catch (error) {
      console.error('Erro no controller de transcrição:', error);
      res.status(500).json({ error: 'Erro ao buscar transcrição' });
    }
  };