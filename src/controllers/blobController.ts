import { Request, Response } from 'express';
import { generateSasUrl } from '../services/blobService';

export const getBlobUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const { blobName, containerName } = req.params;
        const blobUrl = await generateSasUrl(blobName);
        
        if (!blobUrl) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
            return;
        }
        
        res.status(200).send({ blobUrl });
    } catch (error: any) {
        console.error('Error generating SAS token', error);
        
        if (error.message && error.message.includes('Azure Storage credentials are not configured')) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
        } else {
            res.status(500).send({ error: 'Error generating SAS token' });
        }
    }
};