import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMeetingsLeadsVenda } from "../services/aiscribeService";

export async function getMeetingsVendas(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const meetingsVendas = await getMeetingsLeadsVenda();

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meetingsVendas),
        };
    } catch (error) {
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

app.http('getMeetingsVendas', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'aiscribe/getMeetingsVendas',
    handler: getMeetingsVendas
});
