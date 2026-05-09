import { UIConfigField } from '@/lib/config/types';
import { getConfiguredModelProviderById } from '@/lib/config/serverRegistry';
import { Model, ModelList, ProviderMetadata } from '../../types';
import BaseModelProvider from '../../base/provider';
import BaseLLM from '../../base/llm';
import BaseEmbedding from '../../base/embedding';
import NvidiaLLM from './nvidiaLLM';

interface NvidiaConfig {
  apiKey: string;
  baseURL: string;
}

const defaultChatModels: Model[] = [
  {
    name: 'Nemotron 3 Super',
    key: 'nemotron-3-super',
  },
  {
    name: 'GPToss 120B',
    key: 'gptoss-120b',
  },
  {
    name: 'Kimi K2.6',
    key: 'kimi-k2-6',
  },
  {
    name: 'GLM 5.1',
    key: 'glm-5-1',
  },
];

const defaultEmbeddingModels: Model[] = [
  {
    name: 'NV-Embed-QA',
    key: 'nv-embed-qa',
  },
];

const providerConfigFields: UIConfigField[] = [
  {
    type: 'password',
    name: 'API Key',
    key: 'apiKey',
    description: 'Your NVIDIA NIM API key',
    required: true,
    placeholder: 'NVIDIA NIM API Key',
    env: 'NVIDIA_API_KEY',
    scope: 'server',
  },
  {
    type: 'string',
    name: 'Base URL',
    key: 'baseURL',
    description: 'The base URL for the NVIDIA NIM API',
    required: true,
    placeholder: 'https://integrate.api.nvidia.com/v1',
    default: 'https://integrate.api.nvidia.com/v1',
    env: 'NVIDIA_BASE_URL',
    scope: 'server',
  },
];

class NvidiaProvider extends BaseModelProvider<NvidiaConfig> {
  constructor(id: string, name: string, config: NvidiaConfig) {
    super(id, name, config);
  }

  async getDefaultModels(): Promise<ModelList> {
    if (this.config.baseURL === 'https://integrate.api.nvidia.com/v1') {
      return {
        embedding: defaultEmbeddingModels,
        chat: defaultChatModels,
      };
    }

    try {
      const res = await fetch(`${this.config.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        return { embedding: [], chat: [] };
      }

      const data = await res.json();
      const models: Model[] = data.data.map((m: any) => ({
        name: m.id,
        key: m.id,
      }));

      return { embedding: [], chat: models };
    } catch {
      return { embedding: [], chat: defaultChatModels };
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
        'Error Loading NVIDIA NIM Chat Model. Invalid Model Selected',
      );
    }

    return new NvidiaLLM({
      apiKey: this.config.apiKey,
      model: key,
      baseURL: this.config.baseURL,
    });
  }

  async loadEmbeddingModel(_key: string): Promise<BaseEmbedding<any>> {
    throw new Error('NVIDIA NIM Provider does not support embedding models.');
  }

  static parseAndValidate(raw: any): NvidiaConfig {
    if (!raw || typeof raw !== 'object')
      throw new Error('Invalid config provided. Expected object');

    return {
      apiKey: raw.apiKey ? String(raw.apiKey) : '',
      baseURL: raw.baseURL
        ? String(raw.baseURL)
        : 'https://integrate.api.nvidia.com/v1',
    };
  }

  static getProviderConfigFields(): UIConfigField[] {
    return providerConfigFields;
  }

  static getProviderMetadata(): ProviderMetadata {
    return {
      key: 'nvidia',
      name: 'NVIDIA NIM',
    };
  }
}

export default NvidiaProvider;
