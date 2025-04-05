import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePaciente } from "../../src/functions/updatePaciente";
import { poolWrite } from "../../src/config/database";
import { HttpRequest, InvocationContext } from "@azure/functions";

// Mockando poolWrite.query
vi.mock("../../src/config/database", () => ({
  poolWrite: {
    query: vi.fn(),
  },
}));

describe("updatePaciente", () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    mockContext = {
      log: vi.fn(),
      error: vi.fn(),
    };
  });

  it("deve retornar 201 quando a atualização for bem-sucedida", async () => {
    const mockBody = { IdPaciente: 1, CorDia7: "vermelho", contatado: true };
    const mockUpdatedPaciente = { IdPaciente: 1, CorDia7: "vermelho", contatado: true };

    (poolWrite.query as jest.Mock).mockResolvedValue({ rowCount: 1, rows: [mockUpdatedPaciente] });

    mockRequest = {
      json: vi.fn().mockResolvedValue(mockBody),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(201);
    expect(response.body).toBe(JSON.stringify({
      message: "Atualização realizada com sucesso.",
      paciente: mockUpdatedPaciente,
    }));
  });

  it("deve retornar 400 se 'IdPaciente' estiver ausente ou inválido", async () => {
    mockRequest = {
      json: vi.fn().mockResolvedValue({ CorDia7: "vermelho" }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.body).toBe(JSON.stringify({
      error: "O campo 'IdPaciente' é obrigatório e deve ser um número.",
    }));
  });

  it("deve retornar 400 se nenhum campo de atualização for fornecido", async () => {
    mockRequest = {
      json: vi.fn().mockResolvedValue({ IdPaciente: 1 }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.body).toBe(JSON.stringify({
      error: "Pelo menos um campo para atualização é necessário.",
    }));
  });

  it("deve retornar 400 se campos inválidos forem enviados", async () => {
    mockRequest = {
      json: vi.fn().mockResolvedValue({ IdPaciente: 1, CampoInvalido: "teste" }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.body).toBe(JSON.stringify({
      error: "Os seguintes campos não são permitidos: CampoInvalido",
    }));
  });

  it("deve retornar 400 se nenhum campo válido for fornecido para atualização", async () => {
    mockRequest = {
      json: vi.fn().mockResolvedValue({ IdPaciente: 1, contatado: false }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(400);
    expect(response.body).toBe(JSON.stringify({
      error: "Nenhuma coluna válida fornecida para atualização.",
    }));
  });

  it("deve retornar 404 se o paciente não for encontrado", async () => {
    (poolWrite.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

    mockRequest = {
      json: vi.fn().mockResolvedValue({ IdPaciente: 1, CorDia7: "azul" }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(404);
    expect(response.body).toBe(JSON.stringify({
      error: "Paciente não encontrado.",
    }));
  });

  it("deve retornar 500 se ocorrer um erro interno", async () => {
    (poolWrite.query as jest.Mock).mockRejectedValue(new Error("Erro no banco de dados"));

    mockRequest = {
      json: vi.fn().mockResolvedValue({ IdPaciente: 1, CorDia7: "verde" }),
      url: "http://localhost/paciente/update",
    };

    const response = await updatePaciente(mockRequest as HttpRequest, mockContext as InvocationContext);

    expect(response.status).toBe(500);
    expect(response.body).toBe(JSON.stringify({
      error: "Erro interno: Erro no banco de dados",
    }));
    expect(mockContext.log).toHaveBeenCalled();
  });
});
