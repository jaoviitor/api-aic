import { fetchAuthToken } from "../../src/services/tokenService";
import { vi, describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
    global.fetch = vi.fn();
});

it("deve retornar um token quando as credenciais estão corretas", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "fake_token" }),
    });

    const token = await fetchAuthToken("valid_client_id", "valid_client_secret");

    expect(token.access_token).toBe("fake_token");
});

it("deve lançar um erro quando a resposta não for bem-sucedida", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
    });

    await expect(fetchAuthToken("invalid_client_id", "invalid_client_secret"))
        .rejects.toThrow("Èrro na requisição do token: Erro ao obter token.");
});

it("deve lançar um erro quando o fetch falhar", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Falha na conexão"));

    await expect(fetchAuthToken("any_id", "any_secret"))
        .rejects.toThrow("Falha na conexão");
});
