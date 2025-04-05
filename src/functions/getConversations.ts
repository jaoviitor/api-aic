import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getUserConversations } from "../services/wudService";

export async function getConversations(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const userId = request.params.userId;

    if (!userId || isNaN(Number(userId))) {
        return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Parâmetro 'userId' é obrigatório e deve ser um número válido." })
        };
    }

    try {
        const conversations = await getUserConversations(Number(userId));
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            jsonBody: conversations
        };
    } catch (error) {
        context.log(`Erro ao buscar conversas: ${error.message}`);
        return {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Erro interno ao buscar conversas." })
        };
    }
};

app.http('getConversations', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'wud/getConversations/{userId}',
    handler: getConversations
});
