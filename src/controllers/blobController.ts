import { Request, Response } from 'express';
import { generateBlobSasUrl } from '../services/blobService';

export const getBlobUrl = (req: Request, res: Response): void => {
    try {
        const { blobName, containerName } = req.params;
        const blobUrl = generateBlobSasUrl(blobName, containerName);
        res.status(200).send({ blobUrl });
    } catch (error) {
        console.error('Error generating SAS token', error);
        res.status(500).send({ error: 'Error generating SAS token' });
    }
};