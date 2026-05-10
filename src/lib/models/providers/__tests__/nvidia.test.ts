import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockConfigProviderById = vi.fn();

vi.mock('@/lib/config/serverRegistry', () => ({
  getConfiguredModelProviderById: (...args: any[]) =>
    mockConfigProviderById(...args),
}));

const { default: NvidiaProvider } = await import('../nvidia');

describe('NvidiaProvider', () => {
  beforeEach(() => {
    mockConfigProviderById.mockReset();
    vi.restoreAllMocks();
    mockConfigProviderById.mockReturnValue({
      id: 'nvidia-1',
      name: 'NVIDIA NIM',
      type: 'nvidia',
      chatModels: [],
      embeddingModels: [],
      config: {},
    });
  });

  describe('static metadata', () => {
    it('returns correct provider key', () => {
      const meta = NvidiaProvider.getProviderMetadata();
      expect(meta.key).toBe('nvidia');
      expect(meta.name).toBe('NVIDIA NIM');
    });

    it('returns config fields', () => {
      const fields = NvidiaProvider.getProviderConfigFields();
      expect(fields).toHaveLength(2);
      expect(fields[0].key).toBe('apiKey');
      expect(fields[1].key).toBe('baseURL');
    });

    it('config fields have correct types', () => {
      const fields = NvidiaProvider.getProviderConfigFields();
      expect(fields[0].type).toBe('password');
      expect(fields[1].type).toBe('string');
      expect(fields[0].required).toBe(true);
      expect(fields[1].required).toBe(true);
    });
  });

  describe('parseAndValidate', () => {
    it('parses valid config', () => {
      const result = NvidiaProvider.parseAndValidate({
        apiKey: 'test-key',
        baseURL: 'https://custom.api.nvidia.com/v1',
      });
      expect(result.apiKey).toBe('test-key');
      expect(result.baseURL).toBe('https://custom.api.nvidia.com/v1');
    });

    it('uses default baseURL when not provided', () => {
      const result = NvidiaProvider.parseAndValidate({ apiKey: 'test-key' });
      expect(result.baseURL).toBe('https://integrate.api.nvidia.com/v1');
    });

    it('defaults apiKey to empty string when not provided', () => {
      const result = NvidiaProvider.parseAndValidate({});
      expect(result.apiKey).toBe('');
      expect(result.baseURL).toBe('https://integrate.api.nvidia.com/v1');
    });

    it('throws for non-object input', () => {
      expect(() => NvidiaProvider.parseAndValidate(null)).toThrow(
        'Invalid config provided',
      );
      expect(() => NvidiaProvider.parseAndValidate('string')).toThrow(
        'Invalid config provided',
      );
    });

    it('converts values to strings', () => {
      const result = NvidiaProvider.parseAndValidate({
        apiKey: 12345,
        baseURL: 67890,
      });
      expect(result.apiKey).toBe('12345');
      expect(result.baseURL).toBe('67890');
    });
  });

  describe('getDefaultModels', () => {
    it('returns hardcoded models for default NVIDIA base URL', async () => {
      const provider = new NvidiaProvider('nvidia-1', 'My NVIDIA', {
        apiKey: 'test-key',
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });

      const models = await provider.getDefaultModels();
      expect(models.chat).toHaveLength(4);
      expect(models.chat[0].name).toBe('Nemotron 3 Super 120B');
      expect(models.chat[0].key).toBe('nvidia/nemotron-3-super-120b-a12b');
      expect(models.chat[1].name).toBe('GPT-OSS 120B');
      expect(models.chat[2].name).toBe('Kimi K2.6');
      expect(models.chat[3].name).toBe('GLM 5.1');
      expect(models.embedding).toHaveLength(2);
      expect(models.embedding[0].name).toBe('NV-Embed-QA');
    });

    it('uses custom model count from config merge', async () => {
      mockConfigProviderById.mockReturnValue({
        id: 'nvidia-2',
        chatModels: [{ name: 'API Model', key: 'api-model' }],
        embeddingModels: [],
      });

      const provider = new NvidiaProvider('nvidia-2', 'Custom NVIDIA', {
        apiKey: 'test-key',
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });

      const models = await provider.getModelList();
      expect(models.chat).toHaveLength(5);
      expect(models.chat[4].name).toBe('API Model');
    });
  });

  describe('getModelList', () => {
    it('merges default models with custom config models', async () => {
      mockConfigProviderById.mockReturnValue({
        id: 'nvidia-1',
        chatModels: [{ name: 'Custom Chat', key: 'custom-chat' }],
        embeddingModels: [{ name: 'Custom Embed', key: 'custom-embed' }],
      });

      const provider = new NvidiaProvider('nvidia-1', 'My NVIDIA', {
        apiKey: 'test-key',
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });

      const models = await provider.getModelList();
      expect(models.chat).toHaveLength(5);
      expect(models.chat[4].key).toBe('custom-chat');
      expect(models.embedding).toHaveLength(3);
      expect(models.embedding[2].key).toBe('custom-embed');
    });
  });

  describe('loadChatModel', () => {
    it('loads a valid chat model', async () => {
      const provider = new NvidiaProvider('nvidia-1', 'My NVIDIA', {
        apiKey: 'test-key',
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });

      const llm = await provider.loadChatModel('nvidia/nemotron-3-super-120b-a12b');
      expect(llm).toBeDefined();
    });

    it('throws for invalid model key', async () => {
      const provider = new NvidiaProvider('nvidia-1', 'My NVIDIA', {
        apiKey: 'test-key',
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });

      await expect(provider.loadChatModel('nonexistent-model')).rejects.toThrow(
        'Invalid Model Selected',
      );
    });
  });

  describe("loadEmbeddingModel", () => {
    it("loads embedding model successfully", async () => {
      const provider = new NvidiaProvider("nvidia-1", "My NVIDIA", {
        apiKey: "test-key",
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      const embedding = await provider.loadEmbeddingModel("nvidia/embed-qa-4");
      expect(embedding).toBeDefined();
    });
  });
});
