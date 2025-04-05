import { describe, it, expect, vi, beforeAll } from "vitest";
import { storage } from "../../src/functions/storage";
import { generateBlobSasUrl } from "../../src/services/blobService";
import { HttpRequest, InvocationContext } from "@azure/functions";

// Mockando as variáveis de ambiente antes de rodar os testes
beforeAll(() => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = "testaccount";
    process.env.AZURE_STORAGE_ACCOUNT_KEY = "testkey";
    process.env.AZURE_STORAGE_CONNECTION_STRING = "UseDevelopmentStorage=true";
});

// Mock da função generateBlobSasUrl
vi.mock("../../src/services/blobService", () => ({
    generateBlobSasUrl: vi.fn(),
}));

describe("storage function", () => {
    const mockContext: InvocationContext = {
        log: vi.fn(),
    } as any;

    it("deve retornar erro 400 se blobName ou containerName não forem fornecidos", async () => {
        const reqSemBlob: HttpRequest = {
            params: { containerName: "test-container" },
        } as any;

        const reqSemContainer: HttpRequest = {
            params: { blobName: "test-blob" },
        } as any;

        const response1 = await storage(reqSemBlob, mockContext);
        expect(response1.status).toBe(400);
        expect(response1.body).toContain("Both 'containerName' and 'blobName' are required.");

        const response2 = await storage(reqSemContainer, mockContext);
        expect(response2.status).toBe(400);
        expect(response2.body).toContain("Both 'containerName' and 'blobName' are required.");
    });

    it("deve retornar a URL do blob se os parâmetros forem válidos", async () => {
        const mockUrl = "https://example.com/sas-url";
        (generateBlobSasUrl as any).mockResolvedValue(mockUrl);

        const req: HttpRequest = {
            params: { containerName: "test-container", blobName: "test-blob" },
        } as any;

        const response = await storage(req, mockContext);
        
        expect(response.status).toBe(200);
        expect(response.body).toContain(mockUrl);
    });

    it("deve retornar erro 500 se generateBlobSasUrl lançar um erro", async () => {
        (generateBlobSasUrl as any).mockRejectedValue(new Error("Erro ao gerar URL"));

        const req: HttpRequest = {
            params: { containerName: "test-container", blobName: "test-blob" },
        } as any;

        const response = await storage(req, mockContext);

        expect(response.status).toBe(500);
        expect(response.body).toContain("Erro ao gerar URL");
    });
});
