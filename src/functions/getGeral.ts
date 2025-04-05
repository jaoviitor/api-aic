import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { handleGetGeral } from "../controllers/requestController";

export async function getGeral(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const result = await handleGetGeral();
        
        
        return {
            status: result.status,
            headers: result.headers || { "Content-Type": "application/json" },
            body: JSON.stringify(result.body),
        };
    } catch(error) {
        return {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Internal Server Error",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
        };
    }
};

app.http('getGeral', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'database/getGeral',
    handler: getGeral
});
