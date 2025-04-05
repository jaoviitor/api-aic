import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { uploadPdfToBlob } from "../services/blobService";
import { parse as parseContentType } from 'content-type';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export async function uploadFile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const contentType = request.headers.get('content-type') || '';
        const { type } = parseContentType(contentType);

        if (type !== 'multipart/form-data') {
            return {
                status: 400,
                body: JSON.stringify({ message: "Content type must be multipart/form-data" }),
                headers: { 'content-type': 'application/json' }
            };
        }

        const body = await request.formData();

        const file = body.get('file') as unknown as File;
        if (!file) {
            return {
                status: 400,
                body: JSON.stringify({ message: "No file uploaded" }),
                headers: { 'content-type': 'application/json' }
            };
        }

        const tempFilePath = path.join(os.tmpdir(), file.name);

        const buffer = await file.arrayBuffer();
        await fs.writeFile(tempFilePath, Buffer.from(buffer));

        const blobRequestId = await uploadPdfToBlob(tempFilePath, file.name);

        await fs.unlink(tempFilePath);

        return {
            status: 200,
            body: JSON.stringify({ message: "File uploaded successfully.",  requestId: blobRequestId }),
            headers: { 'content-type': 'application/json' }
        };

    } catch (error) {
        context.log(`Error: ${error.message}`);
        return {
            status: 500,
            body: JSON.stringify({ message: `Internal Server Error: ${error.message}` }),
            headers: { 'content-type': 'application/json' }
        };
    }
    
};

app.http('uploadFile', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'storage/uploadFile',
    handler: uploadFile
});
