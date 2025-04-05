import { describe, it, expect, vi, beforeEach  } from "vitest";
import { getGeral } from "../../src/services/requestService";
import { poolWrite } from "../../src/config/database";

vi.mock("../../src/config/database", () => ({
    poolWrite: {
        query: vi.fn(),
    },
}));

describe("getGeral", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deve retornar os dados da tabela HC.Geral", async () => {
        const mockResult = {
            rows: [
                {
                    "idgeral": 1,
                    "hospital": "hospitalteste",
                    "modelo": "gpt-35-turbo",
                    "totaltokenssaida": 0,
                    "totaltokensprompt": 0,
                    "totalusd": "0.00000"
                },
            ],
        };

        (poolWrite.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await getGeral();

        expect(result).toEqual(mockResult.rows);
        expect(poolWrite.query).toHaveBeenCalledTimes(1);
        expect(poolWrite.query).toHaveBeenCalledWith(`
            SELECT * FROM HC.Geral
            `);
    });

    it("deve lançar um erro ao falhar na query", async () => {
        const mockError = new Error("Database connection failed");
        (poolWrite.query as jest.Mock).mockRejectedValue(mockError);

        await expect(getGeral()).rejects.toThrow(
            "Error accessing database: Database connection failed"
        );

        expect(poolWrite.query).toHaveBeenCalledTimes(1);
    });
});
