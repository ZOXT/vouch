import { env, type Env} from "../config/env";
import { logger } from "../config/logger";

const EMBEDDING_URL = env.EMBEDDING_SERVICE_URL ?? "http://localhost:8000";


type EmbedType = "document" | "query";

/**
 * Generate a single embedding for one text.
 *
 * @param text - The text to embed (transcript or search query)
 * @param type - "document" for transcripts, "query" for search queries
 * @returns Array of 768 floats
 */

export const generateEmbedding = async (
    text: string,
    type: EmbedType = "query"
): Promise<number[]> =>{

    const startedAt = Date.now();

    const res = await fetch(`${EMBEDDING_URL}/embed`, {
        method: "POST",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({ texts: [text], type})

    });

    if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding service error ${res.status}: ${err}`);
  }

  const data = await res.json() as {embeddings : number[][] };
  const embedding = data.embeddings[0]
  if (!embedding || embedding.length !== 768) {
  throw new Error(
    `Invalid embedding dimension: ${embedding?.length}`
  );
}

  logger.info(
    { latencyMs: Date.now() - startedAt, dim: embedding.length, type },
    "Embedding generated"
  );
return embedding;


}
