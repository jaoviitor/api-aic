import { Request, Response } from 'express';
import { uploadPdf } from "../services/blobService";
import { parse as parseContentType } from 'content-type';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const contentType = req.headers['content-type'] || '';
        const { type } = parseContentType(contentType);

        if (type !== 'multipart/form-data') {
            res.status(400).json({ message: "Content type must be multipart/form-data" });
            return;
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const file = req.files.file;
        
        const uploadedFile = Array.isArray(file) ? file[0] : file;

        if (!uploadedFile) {
            res.status(400).json({ message: "No file uploaded with 'file' field name" });
            return;
        }

        let pdfBuffer: Buffer;
        
        if (uploadedFile.tempFilePath) {
            // Se o arquivo foi salvo temporariamente pelo middleware
            pdfBuffer = await fs.readFile(uploadedFile.tempFilePath);
        } else {
            // Se o arquivo está na memória
            pdfBuffer = uploadedFile.data;
        }
        
        // Fazer upload do buffer diretamente
        const blobUrl = await uploadPdf(pdfBuffer, uploadedFile.name);
        
        if (!blobUrl) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
            return;
        }
        
        // Limpar o arquivo temporário se existir
        if (uploadedFile.tempFilePath) {
            await fs.unlink(uploadedFile.tempFilePath);
        }
        
        res.status(200).json({
            message: "File uploaded successfully.",
            blobUrl: blobUrl
        });
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        
        if (error.message && error.message.includes('Azure Storage credentials are not configured')) {
            res.status(503).json({
                message: 'Azure Storage service is not available',
                details: 'Storage service is not properly configured'
            });
        } else {
            res.status(500).json({
                message: `Internal Server Error: ${error.message}`
            });
        }
    }
};