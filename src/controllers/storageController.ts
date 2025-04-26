import { Request, Response } from 'express';
import { generateSasUrl } from "../services/blobService";

export const getBlob = async (req: Request, res: Response): Promise<void> => {
    const blobName = req.params.blobName;
    const containerName = req.params.containerName;

    if (!blobName || !containerName) {
        res.status(400).json({
            message: 'Missing required parameters',
            details: 'blobName and containerName are required'
        });
        return;
    }

    try {
        // O containerName já está configurado no blobService.ts
        const blobUrl = await generateSasUrl(blobName);
        
        if (!blobUrl) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
            return;
        }
        
        res.status(200).json({ url: blobUrl });
    } catch (error: any) {
        console.error(`Error generating SAS URL: ${error.message}`);
        
        if (error.message && error.message.includes('Azure Storage credentials are not configured')) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
        } else {
            res.status(500).json({
                message: 'Error generating SAS URL',
                error: error.message
            });
        }
    }
};