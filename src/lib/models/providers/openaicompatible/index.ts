import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { ModelList, ProviderMetadata } from '../../types';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import BaseEmbedding from '../../base/embedding';
import OpenAICompatibleLLM from './openaicompatibleLLM';

interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL: string;
}

const providerConfigFields: UIConfigField[] = [
  {
    type: 'string',
    name: 'Base URL',
    key: 'baseURL',
    description: 'The base URL for the OpenAI-compatible API',
    required: true,
    placeholder: 'https://api.example.com/v1',
    env: 'OPENAI_COMPATIBLE_BASE_URL',
    scope: 'server',
  },
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your API key (leave blank if not required)',
    required: false,
    placeholder: 'API Key (optional)',
    env: 'OPENAI_COMPATIBLE_API_KEY',
    scope: 'server',
  },
];

class OpenAICompatibleProvider extends BaseModelProvider<OpenAICompatibleConfig> {
  constructor(id: string, name: string, config: OpenAICompatibleConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const res = await fetch(`${this.config.baseURL}/models`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        return { embedding: [], chat: [] };
      }

      const data = await res.json();
      const models = (data.data || data).map((m: any) => ({
        name: m.id || m.name || m,
        key: m.id || m,
      }));

      return { embedding: [], chat: models };
    } catch {
      return { embedding: [], chat: [] };
    }
  }

  async getModelList(): Promise<ModelList> {
    const defaultModels = await this.getDefaultModels();
    const configProvider = getConfiguredModelProviderById(this.id)!;

    return {
      embedding: [
        ...defaultModels.embedding,
        ...configProvider.embeddingModels,
      ],
      chat: [...defaultModels.chat, ...configProvider.chatModels],
    };
  }

  async loadChatModel(key: string): Promise<BaseLLM<any>> {
    const modelList = await this.getModelList();

    const exists = modelList.chat.find((m) => m.key === key);

    if (!exists) {
      throw new Error(
        'Error Loading OpenAI Compatible Chat Model. Invalid Model Selected',
      );
    }

    return new OpenAICompatibleLLM({
      apiKey: this.config.apiKey || 'noop',
      model: key,
      baseURL: this.config.baseURL,
    });
  }

  async loadEmbeddingModel(_key: string): Promise<BaseEmbedding<any>> {
    throw new Error(
      'OpenAI Compatible Provider does not support embedding models.',
    );
  }

  static parseAndValidate(raw: any): OpenAICompatibleConfig {
    if (!raw || typeof raw !== 'object')
      throw new Error('Invalid config provided. Expected object');
    if (!raw.baseURL)
      throw new Error('Invalid config provided. Base URL must be provided');

    return {
      baseURL: String(raw.baseURL).replace(/\/+$/, ''),
      apiKey: raw.apiKey ? String(raw.apiKey) : '',
    };
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'openaicompatible',
      name: 'OpenAI Compatible',
    };
  }
}

export default OpenAICompatibleProvider;
