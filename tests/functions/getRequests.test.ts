import { describe, it, expect, vi, beforeEach  } from "vitest";
import { getRequests } from "../../src/services/requestService";
import { poolWrite } from "../../src/config/database";

vi.mock('../../src/config/database', () => ({
    poolWrite: {
        query: vi.fn(),
    },
}));

const mockContext = {
    log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        verbose: vi.fn(),
    },
    invocationId: "mockInvocationId",
} as any;

describe('getRequests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deve retornar as linhas quando a query é bem-sucedida", async () => {
        const mockResult = {
            rows: [
                {
                    "idrequest": 1,
                    "hospital": "hospitalteste",
                    "tempo_enviado": "06/01/25 15:57:07",
                    "tempo_recebido": "15/01/25 09:43:19",
                    "tempo_total_gasto": "12586.15",
                    "modelo": "gpt-35-turbo",
                    "resposta": "Parece que você está realizando um teste de configuração. Como posso ajudar você hoje relacionadas a cirurgia plástica?",
                    "score_leitura": "17.20",
                    "comprimento_medio_palavras": "5.67",
                    "contador_de_palavras": 18,
                    "contador_de_sentencas": 2,
                    "comprimento_medio_sentencas": "9.00",
                    "tokens_de_saida": 23,
                    "tokens_de_prompt": 411,
                    "preco_usd": "0.00000"
                },
            ],
        };

        (poolWrite.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await getRequests();

        expect(result).toEqual(mockResult.rows);
        expect(poolWrite.query).toHaveBeenCalledTimes(1);
        expect(poolWrite.query).toHaveBeenCalledWith(`
            SELECT * FROM HC.Requests
            `);
    });

    it("deve lançar um erro se a query falhar", async () => {
        const mockError = new Error("Erro ao acessar o banco");

        (poolWrite.query as jest.Mock).mockRejectedValue(mockError);

        await expect(getRequests()).rejects.toThrow(
            "Error accessing database: Erro ao acessar o banco"
        );

        expect(poolWrite.query).toHaveBeenCalledTimes(1);
    });
})