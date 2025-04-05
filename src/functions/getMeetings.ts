import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMeetingsWithDetails } from "../services/aiscribeService";

export async function getMeetings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const meetings = await getMeetingsWithDetails();

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meetings),
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

app.http('getMeetings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'aiscribe/getMeetings',
    handler: getMeetings
});
