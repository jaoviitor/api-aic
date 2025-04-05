import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { insertPaciente } from "../services/pacienteService";

export async function addPaciente(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const body = await request.json();

        if (!body) {
            return {
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "O corpo da requisição está vazio ou inválido" }),
            };
        }

        const result = await insertPaciente(body);

        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body:JSON.stringify({
                message: "Paciente inserido com sucesso.",
                data: result,
            }),
        };
    } catch (error) {
        context.error(`Erro ao processar requisição: ${error.message}`);
        return {
            status: 500,
            body : JSON.stringify({ error: `Erro interno: ${error.message}` }),
        };
    }
};

app.http('addPaciente', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'database/insertPaciente',
    handler: addPaciente
});
