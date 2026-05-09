import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/config/serverRegistry', () => ({
  getConfiguredModelProviders: () => [],
  getConfiguredModelProviderById: () => ({
    id: 'mock',
    name: 'Mock',
    type: 'mock',
    chatModels: [],
    embeddingModels: [],
    config: {},
  }),
}));

const { providers, getModelProvidersUIConfigSection } =
  await import('../index');

describe('Provider Registry', () => {
  describe('providers record', () => {
    it('contains all expected providers', () => {
      const keys = Object.keys(providers);
      expect(keys).toContain('openai');
      expect(keys).toContain('ollama');
      expect(keys).toContain('gemini');
      expect(keys).toContain('transformers');
      expect(keys).toContain('groq');
      expect(keys).toContain('lemonade');
      expect(keys).toContain('anthropic');
      expect(keys).toContain('lmstudio');
      expect(keys).toContain('nvidia');
      expect(keys).toContain('openaicompatible');
    });

    it('has exactly 10 providers', () => {
      expect(Object.keys(providers)).toHaveLength(10);
    });

    it('each provider has required static methods', () => {
      Object.entries(providers).forEach(([key, Provider]) => {
        expect(typeof Provider.getProviderMetadata).toBe('function');
        expect(typeof Provider.getProviderConfigFields).toBe('function');
        expect(typeof Provider.parseAndValidate).toBe('function');

        const meta = Provider.getProviderMetadata();
        expect(meta.key).toBe(key);
        expect(typeof meta.name).toBe('string');
      });
    });
  });

  describe('getModelProvidersUIConfigSection', () => {
    it('returns an array with all providers', () => {
      const sections = getModelProvidersUIConfigSection();
      expect(sections).toHaveLength(10);
    });

    it('each section has the correct structure', () => {
      const sections = getModelProvidersUIConfigSection();
      sections.forEach((section) => {
        expect(section).toHaveProperty('fields');
        expect(section).toHaveProperty('key');
        expect(section).toHaveProperty('name');
        expect(Array.isArray(section.fields)).toBe(true);
      });
    });

    it('includes NVIDIA NIM section', () => {
      const sections = getModelProvidersUIConfigSection();
      const nvidia = sections.find((s) => s.key === 'nvidia');
      expect(nvidia).toBeDefined();
      expect(nvidia!.name).toBe('NVIDIA NIM');
      expect(nvidia!.fields.length).toBeGreaterThan(0);
    });

    it('includes OpenAI Compatible section', () => {
      const sections = getModelProvidersUIConfigSection();
      const oac = sections.find((s) => s.key === 'openaicompatible');
      expect(oac).toBeDefined();
      expect(oac!.name).toBe('OpenAI Compatible');
      expect(oac!.fields.length).toBeGreaterThan(0);
    });

    it('NVIDIA NIM fields include apiKey and baseURL', () => {
      const sections = getModelProvidersUIConfigSection();
      const nvidia = sections.find((s) => s.key === 'nvidia')!;
      const fieldKeys = nvidia.fields.map((f) => f.key);
      expect(fieldKeys).toContain('apiKey');
      expect(fieldKeys).toContain('baseURL');
    });

    it('OpenAI Compatible fields include baseURL and apiKey', () => {
      const sections = getModelProvidersUIConfigSection();
      const oac = sections.find((s) => s.key === 'openaicompatible')!;
      const fieldKeys = oac.fields.map((f) => f.key);
      expect(fieldKeys).toContain('baseURL');
      expect(fieldKeys).toContain('apiKey');
    });

    it('all provider sections have unique keys', () => {
      const sections = getModelProvidersUIConfigSection();
      const keys = sections.map((s) => s.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
