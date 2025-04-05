import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { generateBlobSasUrl } from "../services/blobService";
import dotenv from 'dotenv';

dotenv.config();

export async function storage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const blobName = request.params.blobName;
    const containerName = request.params.containerName;

    if (!blobName || !containerName) {
        return {
            status: 400,
            body: JSON.stringify({ error: "Both 'containerName' and 'blobName' are required." }),
            headers: { 'content-type': 'application/json' }
        };
    }

    try {
        const blobUrl = await generateBlobSasUrl(blobName, containerName);

        return {
            status: 200,
            body: JSON.stringify({ url: blobUrl }),
            headers: { 'content-type': 'application/json' }
        };
    } catch (error) {
        return {
            status: 500,
            body: JSON.stringify({ message: error.message || 'Unknown error' }),
            headers: { 'content-type': 'application/json' }
        };
    }

};

app.http('storage', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'storage/{containerName}/getBlob/{blobName}',
    handler: storage
});
