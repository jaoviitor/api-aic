import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { poolWrite } from "../config/database";

export async function updatePaciente(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const body = (await request.json()) as Record<string, any>;
        const { IdPaciente, ...updateFields } = body;

        if (!IdPaciente || typeof IdPaciente !== "number") {
            return { status: 400, body: JSON.stringify({ error: "O campo 'IdPaciente' é obrigatório e deve ser um número." }) };
        }

        if (!updateFields || Object.keys(updateFields).length === 0) {
            return { status: 400, body: JSON.stringify({ error: "Pelo menos um campo para atualização é necessário." }) };
        }

        const allowedFields = [
            "CorDia7", "CorDia11", "CorDia30", "contatado",
            "dia7observacao", "dia11observacao", "dia15observacao", 
            "dia30observacao", "dia45observacao", "dia60observacao", "dia90observacao"
        ];

        const invalidFields = Object.keys(updateFields).filter(key => !allowedFields.includes(key));

        if (invalidFields.length > 0) {
            return {
                status: 400,
                body: JSON.stringify({ error: `Os seguintes campos não são permitidos: ${invalidFields.join(", ")}` })
            };
        }
        
        const updates = Object.entries(updateFields).filter(([key, value]) => allowedFields.includes(key) && (key !== "contatado" || value === true));

        if (updates.length === 0) {
            return { status: 400, body: JSON.stringify({ error: "Nenhuma coluna válida fornecida para atualização." }) };
        }

        const setClauses = updates.map(([key], index) => `${key} = $${index + 2}`).join(", ");
        const values = updates.map(([, value]) => value);

        const query = `
            UPDATE Public.Paciente
            SET ${setClauses}
            WHERE IdPaciente = $1
            RETURNING *;
        `;

        const result = await poolWrite.query(query, [IdPaciente, ...values]);

        if (result.rowCount === 0) {
            return { status: 404, body: JSON.stringify({ error: "Paciente não encontrado." }) };
        }

        return { status: 201, body: JSON.stringify({ message: "Atualização realizada com sucesso.", paciente: result.rows[0] }) };
    } catch (error: any) {
        context.log(`Error: ${error.message}`);
        return { status: 500, body: JSON.stringify({ error: `Erro interno: ${error.message}` }) };
    }
};

app.http('updatePaciente', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: "paciente/update",
    handler: updatePaciente
});
