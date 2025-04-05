import { describe, it, expect, vi, beforeEach } from "vitest";
import { addPaciente } from "../../src/functions/addPaciente";
import { insertPaciente } from "../../src/services/pacienteService";
import { HttpRequest, InvocationContext } from "@azure/functions";

// Mockando a função `insertPaciente`
vi.mock("../../src/services/pacienteService", () => ({
  insertPaciente: vi.fn(),
}));

describe("addPaciente", () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    mockContext = {
      log: vi.fn(),
      error: vi.fn(),
    };
  });

  it("deve retornar 201 quando o paciente for inserido com sucesso", async () => {
    const mockPaciente = { nome: "João", idade: 30 };
    const mockResponse = { id: 1, ...mockPaciente };

    (insertPaciente as jest.Mock).mockResolvedValue(mockResponse);

    mockRequest = {
      json: vi.fn().mockResolvedValue(mockPaciente),
      url: "http://localhost/database/insertPaciente",
    };

    const response = await addPaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(201);
    expect(response.headers?.["Content-Type"]).toBe("application/json");
    expect(response.body).toBe(JSON.stringify({
      message: "Paciente inserido com sucesso.",
      data: mockResponse,
    }));
  });

  it("deve retornar 400 se o corpo da requisição estiver vazio", async () => {
    mockRequest = {
      json: vi.fn().mockResolvedValue(null),
      url: "http://localhost/database/insertPaciente",
    };

    const response = await addPaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.headers?.["Content-Type"]).toBe("application/json");
    expect(response.body).toBe(JSON.stringify({
      error: "O corpo da requisição está vazio ou inválido",
    }));
  });

  it("deve retornar 500 se ocorrer um erro no servidor", async () => {
    (insertPaciente as jest.Mock).mockRejectedValue(new Error("Erro ao acessar o banco"));

    const mockPaciente = { nome: "Erro", idade: 40 };
    mockRequest = {
      json: vi.fn().mockResolvedValue(mockPaciente),
      url: "http://localhost/database/insertPaciente",
    };

    const response = await addPaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(500);
    expect(response.body).toBe(JSON.stringify({
      error: "Erro interno: Erro ao acessar o banco",
    }));
    expect(mockContext.error).toHaveBeenCalled();
  });
});
