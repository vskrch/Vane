import OpenAIEmbedding from "../openai/openaiEmbedding";
import OpenAI from "openai";
import { Chunk } from "@/lib/types";

type NvidiaEmbeddingConfig = {
  apiKey: string;
  model: string;
  baseURL?: string;
};

class NvidiaEmbedding extends OpenAIEmbedding {
  constructor(protected config: NvidiaEmbeddingConfig) {
    super(config);
  }

  async embedText(texts: string[]): Promise<number[][]> {
    const response = await (this.openAIClient as any).embeddings.create({
      model: this.config.model,
      input: texts,
      input_type: "passage",
    });

    return response.data.map((embedding: any) => embedding.embedding);
  }

  async embedChunks(chunks: Chunk[]): Promise<number[][]> {
    const response = await (this.openAIClient as any).embeddings.create({
      model: this.config.model,
      input: chunks.map((c) => c.content),
      input_type: "passage",
    });

    return response.data.map((embedding: any) => embedding.embedding);
  }
}

export default NvidiaEmbedding;
