// consumeWebhook.test.ts
import axios from 'axios';
import { consumeWebhook } from '../../src/services/webhookService';
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock completo do axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('consumeWebhook', () => {
  const hospitalId = 1;
  const webhookUrl = 'https://example.com/webhook';
  const mockHeaders = {
    'aicuryhc': 'gMCgs6GoXikEuuDQMsN7XnTF0ZZ7gp0X',
    'Content-Type': 'application/json',
  };

  beforeEach(() => {
    // Configura ambiente antes de cada teste
    process.env.N8N_WEBHOOK = webhookUrl;
    
    // Resetar mocks do axios
    vi.mocked(axios.post).mockReset();
  });

  it('deve consumir o webhook com sucesso', async () => {
    // Configurar mock para sucesso
    vi.mocked(axios.post).mockResolvedValue({ status: 200 });

    await consumeWebhook(hospitalId);

    // Verificar chamada do axios.post
    expect(axios.post).toHaveBeenCalledWith(
      webhookUrl,
      { id: hospitalId },
      { headers: mockHeaders }
    );
  });

  it('deve logar um erro ao consumir o webhook falhar', async () => {
    // Configurar mock para erro
    const mockError = new Error('Erro de rede');
    vi.mocked(axios.post).mockRejectedValue(mockError);
    
    // Mock do console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await consumeWebhook(hospitalId);

    // Verificar chamada do axios.post
    expect(axios.post).toHaveBeenCalledWith(
      webhookUrl,
      { id: hospitalId },
      { headers: mockHeaders }
    );

    // Verificar log de erro
    expect(consoleSpy).toHaveBeenCalledWith(
      `Error consuming the webhook: ${mockError.message}`
    );
    
    // Restaurar console
    consoleSpy.mockRestore();
  });
});