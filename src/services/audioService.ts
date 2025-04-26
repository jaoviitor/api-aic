import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = "aic-aiscribes";

export const downloadAudioFile = async (blobName: string): Promise<Buffer> => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(blobName);

    if (!(await blobClient.exists())) {
        throw new Error(`O arquivo "${blobName}" não foi encontrado no container.`);
    }

    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);
    return downloaded;
};

const streamToBuffer = async (readableStream: NodeJS.ReadableStream): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
        const bufferChunk = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array);
        chunks.push(bufferChunk);
    }
    return Buffer.concat(chunks);
};