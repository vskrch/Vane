import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockConfigProviderById = vi.fn();
vi.mock('@/lib/config/serverRegistry', () => ({
  getConfiguredModelProviderById: (...args: any[]) =>
    mockConfigProviderById(...args),
}));

const { default: OpenAICompatibleProvider } =
  await import('../openaicompatible');

describe('OpenAICompatibleProvider', () => {
  beforeEach(() => {
    mockConfigProviderById.mockReset();
    mockConfigProviderById.mockReturnValue({
      id: 'custom-1',
      name: 'My Custom API',
      type: 'openaicompatible',
      chatModels: [],
      embeddingModels: [],
      config: {},
    });
  });

  describe('static metadata', () => {
    it('returns correct provider key and name', () => {
      const meta = OpenAICompatibleProvider.getProviderMetadata();
      expect(meta.key).toBe('openaicompatible');
      expect(meta.name).toBe('OpenAI Compatible');
    });

    it('returns config fields', () => {
      const fields = OpenAICompatibleProvider.getProviderConfigFields();
      expect(fields).toHaveLength(2);
      expect(fields[0].key).toBe('baseURL');
      expect(fields[1].key).toBe('apiKey');
    });

    it('baseURL is required, apiKey is optional', () => {
      const fields = OpenAICompatibleProvider.getProviderConfigFields();
      expect(fields[0].required).toBe(true);
      expect(fields[1].required).toBe(false);
    });

    it('baseURL has correct default placeholder', () => {
      const fields = OpenAICompatibleProvider.getProviderConfigFields();
      const field = fields[0]; if ("placeholder" in field) { expect(field.placeholder).toBe('https://api.example.com/v1'); };
    });
  });

  describe('parseAndValidate', () => {
    it('parses valid config with all fields', () => {
      const result = OpenAICompatibleProvider.parseAndValidate({
        baseURL: 'https://api.example.com/v1',
        apiKey: 'test-key',
      });
      expect(result.baseURL).toBe('https://api.example.com/v1');
      expect(result.apiKey).toBe('test-key');
    });

    it('parses valid config without apiKey', () => {
      const result = OpenAICompatibleProvider.parseAndValidate({
        baseURL: 'https://api.example.com/v1',
      });
      expect(result.baseURL).toBe('https://api.example.com/v1');
      expect(result.apiKey).toBe('');
    });

    it('strips trailing slash from baseURL', () => {
      const result = OpenAICompatibleProvider.parseAndValidate({
        baseURL: 'https://api.example.com/v1/',
      });
      expect(result.baseURL).toBe('https://api.example.com/v1');
    });

    it('throws for non-object input', () => {
      expect(() => OpenAICompatibleProvider.parseAndValidate(null)).toThrow(
        'Invalid config provided',
      );
      expect(() =>
        OpenAICompatibleProvider.parseAndValidate(undefined),
      ).toThrow('Invalid config provided');
    });

    it('throws when baseURL is missing', () => {
      expect(() =>
        OpenAICompatibleProvider.parseAndValidate({ apiKey: 'key' }),
      ).toThrow('Base URL must be provided');
    });
  });

  describe('getDefaultModels', () => {
    it('returns empty when fetch fails', async () => {
      const provider = new OpenAICompatibleProvider('custom-1', 'My API', {
        baseURL: 'https://unreachable.api.example.com/v1',
        apiKey: 'test-key',
      });

      const models = await provider.getDefaultModels();
      expect(models.chat).toHaveLength(0);
      expect(models.embedding).toHaveLength(0);
    });
  });

  describe('getModelList', () => {
    it('merges API models with custom config models', async () => {
      mockConfigProviderById.mockReturnValue({
        id: 'custom-1',
        chatModels: [{ name: 'User Added Model', key: 'user-model' }],
        embeddingModels: [],
      });

      const provider = new OpenAICompatibleProvider('custom-1', 'My API', {
        baseURL: 'https://unreachable.api.example.com/v1',
        apiKey: 'key',
      });

      const models = await provider.getModelList();
      expect(models.chat).toHaveLength(1);
      expect(models.chat[0].key).toBe('user-model');
    });
  });

  describe('loadChatModel', () => {
    it('throws for nonexistent model', async () => {
      const provider = new OpenAICompatibleProvider('custom-1', 'My API', {
        baseURL: 'https://unreachable.api.example.com/v1',
        apiKey: 'test-key',
      });

      await expect(provider.loadChatModel('nonexistent')).rejects.toThrow(
        'Invalid Model Selected',
      );
    });
  });

  describe('loadEmbeddingModel', () => {
    it('throws because provider does not support embeddings', async () => {
      const provider = new OpenAICompatibleProvider('custom-1', 'My API', {
        baseURL: 'https://api.example.com/v1',
        apiKey: 'test-key',
      });

      await expect(provider.loadEmbeddingModel('any-model')).rejects.toThrow(
        'does not support embedding models',
      );
    });
  });
});
