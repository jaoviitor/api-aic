// insertPaciente.test.ts
import { describe, expect, test, vi, afterEach } from 'vitest';
import { insertPaciente } from '../../src/services/pacienteService';
import { poolWrite } from '../../src/config/database';

// Mock do pool de conexão
vi.mock('../../src/config/database', () => ({
  poolWrite: {
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn(),
    })),
  },
}));

describe('insertPaciente', () => {
  const mockPacienteData = {
    Nome: 'João Silva',
    DtNascimento: '1990-01-01',
    Sexo: 'M',
    Prontuario: '12345',
    Clinica: 'Clínica Central',
    TipoCirurgia: 'Apêndice',
    DtCirurgia: '2023-10-10',
    Anamnese: 'Histórico médico detalhado',
    NumTelefone: '11999999999',
    NumTelefone2: '11888888888',
    NumTelefone3: '11777777777',
    NumTelefone4: '11666666666',
  };

  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('deve inserir paciente e números com sucesso', async () => {
    // Configurar mocks corretamente
    (poolWrite.connect as any).mockResolvedValue(mockClient);
    
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ idpaciente: 1 }] }) // INSERT paciente
      .mockResolvedValueOnce({ rows: [{}] }) // INSERT numero
      .mockResolvedValueOnce({}); // COMMIT

    // Executar
    const result = await insertPaciente(mockPacienteData);

    // Verificar transação
    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    
    // Verificar insert paciente
    expect(mockClient.query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('INSERT INTO public.paciente'),
      [
        mockPacienteData.Nome,
        mockPacienteData.DtNascimento,
        mockPacienteData.Sexo,
        mockPacienteData.Prontuario,
        mockPacienteData.Clinica,
        mockPacienteData.TipoCirurgia,
        mockPacienteData.DtCirurgia,
        mockPacienteData.Anamnese,
        mockPacienteData.NumTelefone,
      ]
    );

    // Resto das verificações permanecem igual...
  });

  test('deve fazer rollback em caso de erro', async () => {
    // Configurar mocks corretamente
    (poolWrite.connect as any).mockResolvedValue(mockClient);
    const mockError = new Error('Erro simulado');
    
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ idpaciente: 1 }] }) // INSERT paciente
      .mockRejectedValueOnce(mockError); // Erro no insert numero

    // Executar e verificar erro
    await expect(insertPaciente(mockPacienteData))
      .rejects.toThrow('Erro ao inserir paciente: Erro simulado');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});