import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');

export async function generateBlobSasUrl(blobName: string, containerName: string): Promise<string> {

    try{
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        const blobExists = await blobClient.exists();
        if(!blobExists){
            throw new Error('Blob not found');
        }

        const permissions = BlobSASPermissions.parse('r'); // somente leitura

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1); //expira em 1h

        const sasToken = generateBlobSASQueryParameters({
            containerName: containerName,
            blobName: blobName,
            expiresOn: expiryDate,
            permissions: permissions
        }, sharedKeyCredential).toString();

        const blobUrl = `${blobClient.url}?${sasToken}`;
        return blobUrl;

    } catch (error) {
        throw new Error(`Error generating a SAS URL: ${error.message}`);
    }
    
};

export async function uploadPdfToBlob(filePath: string, originalFilename: string): Promise<string> {
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_COUNTAINER_NAME_PDF);
    const blobName = path.basename(originalFilename);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        const fileBuffer = await fs.readFile(filePath);
        const uploadBlobResponse = await blockBlobClient.upload(fileBuffer, fileBuffer.length);
        console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId)
        return uploadBlobResponse.requestId;
    } catch (error) {
        throw new Error(`Error uploading file: ${error.message}`);
    }
}