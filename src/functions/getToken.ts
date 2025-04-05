import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { fetchAuthToken } from "../services/tokenService";

export async function getToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

   try{
    const body = await request.json() as { clientId: string; clientSecret: string };
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
        return {
            status: 400,
            body: JSON.stringify({ error: "Os campos 'client_id' e 'client_secret' são obrigatórios." })
        };
    }

    const tokenData = await fetchAuthToken(clientId, clientSecret);

    return {
        status: 200,
        body: JSON.stringify(tokenData)
    };
   } catch (error: any) {
    return {
        status: 500,
        body: JSON.stringify({ error: `Erro interno: ${error.message}` })
    };
   }
};

app.http('getToken', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "auth/token",
    handler: getToken
});
