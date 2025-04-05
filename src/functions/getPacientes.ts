import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { handleGetPacientes } from "../controllers/pacienteController";

export async function GetPacientes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        const result = await handleGetPacientes(user, pass);


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

app.http('GetPacientes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'database/getPaciente',
    handler: GetPacientes
});
