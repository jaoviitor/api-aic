import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

// Usar as variáveis de ambiente disponíveis no arquivo .env
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_COUNTAINER_NAME_PDF || 'vital-pdfs';

// Verificar se as credenciais do Azure Storage estão disponíveis
const hasAzureCredentials = !!(accountName && accountKey) || !!connectionString;

// Inicializar o cliente do Blob Storage apenas se as credenciais estiverem disponíveis
let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

if (hasAzureCredentials) {
    try {
        if (connectionString) {
            blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        } else if (accountName && accountKey) {
            const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
            const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
            blobServiceClient = new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
        }

        if (blobServiceClient && containerName) {
            containerClient = blobServiceClient.getContainerClient(containerName);
        }
    } catch (error) {
        console.error('Erro ao inicializar o cliente do Azure Blob Storage:', error);
    }
}

/**
 * Gera uma URL SAS para um blob
 * @param blobName Nome do blob
 * @param expiryMinutes Tempo de expiração em minutos
 * @returns URL SAS ou null se não for possível gerar
 */
export const generateSasUrl = async (blobName: string, expiryMinutes: number = 60): Promise<string | null> => {
    if (!hasAzureCredentials || !accountName || !accountKey || !containerClient) {
        console.error('Azure Storage credentials are not configured');
        return null;
    }

    try {
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

        const sasOptions = {
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("r"),
            expiresOn: expiryTime,
        };

        const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
        const blobClient = containerClient.getBlobClient(blobName);
        
        return `${blobClient.url}?${sasToken}`;
    } catch (error) {
        console.error('Erro ao gerar URL SAS:', error);
        return null;
    }
};

/**
 * Faz upload de um PDF para o Azure Blob Storage
 * @param pdfBuffer Buffer do PDF
 * @param blobName Nome do blob
 * @returns URL do blob ou null se o upload falhar
 */
export const uploadPdf = async (pdfBuffer: Buffer, blobName: string): Promise<string | null> => {
    if (!hasAzureCredentials || !containerClient) {
        console.error('Azure Storage credentials are not configured');
        return null;
    }

    try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(pdfBuffer, {
            blobHTTPHeaders: {
                blobContentType: 'application/pdf'
            }
        });
        
        return blockBlobClient.url;
    } catch (error) {
        console.error('Erro ao fazer upload do PDF:', error);
        return null;
    }
};