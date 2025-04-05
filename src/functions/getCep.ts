import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

export async function getCep(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const cep = request.params.cep;
    const cepRegex = /^[0-9]{8}$/;

    if (!cep) {
        return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Missing CEP" }),
        };
    }

    if (!cepRegex.test(cep)) {
        return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "CEP inválido. Informe um CEP com 8 dígitos numéricos." })
        }
    }

    try {
        const result = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (result.data.erro) {
            return {
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "CEP não encontrado." })
            }
        }

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify( result.data )
        }
    } catch (error) {
        return {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Erro ao buscar informações do CEP." })
        }
    }
};

app.http('getCep', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'external/getCep/{cep}',
    handler: getCep
});
