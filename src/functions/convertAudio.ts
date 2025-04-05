import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from 'axios';

export async function convertAudio(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const body: { audioUrl?: string } = await request.json();
        const audioUrl = body.audioUrl;

        if (!audioUrl) {
            return { status: 400, body: JSON.stringify({ error: 'O campo "audioUrl" é obrigatório.' }) };
        }

        const response = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 300000 });
        const audioBase64 = Buffer.from(response.data).toString('base64');

        return {
            status: 200,
            body: JSON.stringify({ base64: audioBase64 }),
            headers: { "Content-Type": "application/json" }
        };
    } catch (error) {
        return {
            status: 500,
            body: JSON.stringify({ error: 'Erro ao converter o áudio para Base64.' }),
        };
    }
};

app.http('convertAudio', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "external/convertAudio",
    handler: convertAudio
});
