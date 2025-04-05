import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPacientes } from '../../src/services/pacienteService';
import { pool } from '../../src/config/database';
import { connectToHospitalDb } from "../../src/config/database";
import { HttpRequest } from '@azure/functions';
import { Readable } from 'stream';

const bodyStream = Readable.from([
    JSON.stringify({ idPaciente: 1, CorDia7: "verde" }),
]);

vi.mock("../../src/config/database", () => ({
    connectToHospitalDb: vi.fn(),
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

describe('getPacientes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve retornar uma lista de pacientes quando a query for bem-sucedida', async () => {
        const mockResult = {
            rows: [
                {
                    "idpaciente": null,
                    "nome": "Pedro Felipe",
                    "prontuario": "658*****",
                    "sexo": "M",
                    "dtnascimento": "2001-01-01T00:00:00.000Z",
                    "dtcirurgia": "2025-01-06T19:53:47.395Z",
                    "tipocirurgia": "TROMBOSE",
                    "clinica": "PERNAS",
                    "confirmado": false,
                    "anamnese": null,
                    "evolucaopaciente": null,
                    "daystraveled": null,
                    "mainnumber": "11*****99",
                    "dia7check": false,
                    "dia9check": false,
                    "dia11check": false,
                    "dia13check": false,
                    "dia15check": false,
                    "dia22check": false,
                    "dia28check": false,
                    "dia30check": false,
                    "dia45check": false,
                    "dia60check": false,
                    "dia90check": false,
                    "cordia7": "vermelho",
                    "cordia11": null,
                    "cordia30": null,
                    "ocultado": false,
                    "dia7observacao": null,
                    "dia11observacao": null,
                    "dia15observacao": null,
                    "dia30observacao": null,
                    "dia45observacao": null,
                    "dia60observacao": null,
                    "dia90observacao": null,
                    "cordia7bot": null,
                    "cordia11bot": null,
                    "cordia30bot": null,
                    "idnumero": 2,
                    "numtelefone": "11*****99",
                    "numtelefone2": "21*****88",
                    "numtelefone3": "31*****77",
                    "numtelefone4": "41*****66",
                    "whatsappligacao": true,
                    "whatsappligacao2": false,
                    "whatsappligacao3": true,
                    "whatsappligacao4": false,
                    "idresposta": null,
                    "dia7febre": null,
                    "dia7localferidainchado": null,
                    "dia7secrecaopus": null,
                    "dia7pontosferida": null,
                    "dia7procurouservicosaude": null,
                    "dia7medicamentos": null,
                    "dia7comentario": null,
                    "dia7resumo": null,
                    "dia11febre": null,
                    "dia11localferidainchado": null,
                    "dia11secrecaopus": null,
                    "dia11procurouservicosaude": null,
                    "dia11medicamentos": null,
                    "dia11comentario": null,
                    "dia11resumo": null,
                    "dia15primeirainternacao": null,
                    "dia15primeiracirurgia": null,
                    "dia15avaiacaointernacao": null,
                    "dia15avaliacaoequipe": null,
                    "dia15avaliacaoestruturafisica": null,
                    "dia15avaliacaoestruturabloco": null,
                    "dia15avaliacaoorientacoesequipe": null,
                    "dia15avaliacaoserico": null,
                    "dia15comentario": null,
                    "dia15resumo": null,
                    "dia30febre": null,
                    "dia30localferidainchado": null,
                    "dia30secrecaopus": null,
                    "dia30procurouservicosaude": null,
                    "dia30medicamentos": null,
                    "dia30comentario": null,
                    "dia30resumo": null,
                    "dia45comentario": null,
                    "dia45resumo": null,
                    "dia60comentario": null,
                    "dia60resumo": null,
                    "dia90comentario": null,
                    "dia90resumo": null,
                    "dia7dtresposta": null,
                    "dia11dtresposta": null,
                    "dia15dtresposta": "2025-02-18T20:53:00.000Z",
                    "dia22dtresposta": null,
                    "dia28dtresposta": null,
                    "dia30dtresposta": "2025-02-19T23:23:00.000Z",
                    "dia45dtresposta": "2025-02-19T23:31:00.000Z",
                    "dia60dtresposta": "2025-02-19T23:47:00.000Z",
                    "dia90dtresposta": null
                }
            ],
        };

        const mockPool = {
            query: vi.fn().mockResolvedValueOnce(mockResult),
            end: vi.fn(),
        };

        (connectToHospitalDb as jest.Mock).mockResolvedValueOnce(mockPool);

        const result = await getPacientes("user_teste", "senha_teste");

        expect(connectToHospitalDb).toHaveBeenCalledWith("user_teste", "senha_teste");
        expect(mockPool.query).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockResult.rows);
    });

    it('deve lançar um erro se ocorrer um problema na query', async () => {
        const mockError = new Error('Database connection failed');
        const mockPool = {
            query: vi.fn().mockRejectedValueOnce(mockError),
            end: vi.fn(),
        };

        (connectToHospitalDb as jest.Mock).mockResolvedValueOnce(mockPool);

        await expect(getPacientes("user_teste", "senha_teste")).rejects.toThrow('Error accessing database: Database connection failed');

        expect(connectToHospitalDb).toHaveBeenCalledWith("user_teste", "senha_teste");
        expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
});