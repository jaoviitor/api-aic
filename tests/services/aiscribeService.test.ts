import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMeetingsWithDetails, createMeeting, getMeetingsLeadsVenda } from '../../src/services/aiscribeService';
import { poolAiScribe } from '../../src/config/database';

// Mock do poolAiScribe
vi.mock('../config/database', () => ({
  poolAiScribe: {
    connect: vi.fn(),
  },
}));

describe('aiscribeService', () => {
  let mockClient: any;

  beforeEach(() => {
    // Resetar mocks
    vi.clearAllMocks();

    // Criar um mock de client para o banco
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    (poolAiScribe.connect as any).mockResolvedValue(mockClient);
  });

  describe('getMeetingsWithDetails', () => {
    it('deve retornar reuniões com detalhes', async () => {
      const mockRows = [
        { id: 1, name: 'Reunião 1' },
        { id: 2, name: 'Reunião 2' },
      ];

      mockClient.query.mockResolvedValue({ rows: mockRows });

      const result = await getMeetingsWithDetails();

      expect(poolAiScribe.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });

    it('deve lançar erro ao falhar no banco', async () => {
      mockClient.query.mockRejectedValue(new Error('Erro no banco'));

      await expect(getMeetingsWithDetails()).rejects.toThrow('Erro ao buscar dados: Erro no banco');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('createMeeting', () => {
    it('deve criar uma reunião', async () => {
      const meetingData = {
        name: 'Reunião Teste',
        description: 'Descrição',
        rawTranscript: 'Texto bruto',
        summary: 'Resumo',
      };

      const mockInserted = { id: 123, ...meetingData };

      mockClient.query.mockResolvedValue({ rows: [mockInserted] });

      const result = await createMeeting(meetingData);

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual(mockInserted);
    });

    it('deve lançar erro se faltar campos obrigatórios', async () => {
      const incompleteData = {
        name: 'Reunião sem resumo',
      };

      await expect(createMeeting(incompleteData)).rejects.toThrow('Todos os campos são obrigatórios');
    });
  });

  describe('getMeetingsLeadsVenda', () => {
    it('deve retornar leads', async () => {
      const mockLeads = [{ id: 1, nome: 'Lead 1' }];

      mockClient.query.mockResolvedValue({ rows: mockLeads });

      const result = await getMeetingsLeadsVenda();

      expect(mockClient.query).toHaveBeenCalled();
      expect(result).toEqual(mockLeads);
    });
  });
});
