import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getEvaluations } from "../services/evaluationService";

export async function getEvaluation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const user = request.headers.get("db-user");
    const pass = request.headers.get("db-pass");

    if (!user || !pass) {
        return {
            status: 400,
            body: JSON.stringify({ error: "Missing database credentials" }),
        };
    }

    try {
        const result = await getEvaluations(user, pass);

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
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

app.http('getEvaluation', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'database/getEvaluation',
    handler: getEvaluation
});
