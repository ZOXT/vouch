// import { Request, Response } from "express";
// import { prisma } from "../config/prisma";
// import { logger } from "../config/logger";
// import { generateEmbedding } from "../services/embedding.service";

// export const searchTestimonials = async (req: Request, res: Response) => {
//   const { query } = req.body;

//   const requestedLimit = Number(req.body.limit) || 10;
//   const limit = Math.min(Math.max(requestedLimit, 1), 50);

//   const userId = req.user?.id;

//   if (!query || typeof query !== "string" || query.trim().length === 0) {
//     return res.status(400).json({
//       error: "Query is required",
//     });
//   }

//   if (!userId) {
//     return res.status(401).json({
//       error: "Unauthorized",
//     });
//   }

//   try {
//     // 1. Convert the user's search query into a 768-dimensional vector.
//     const queryEmbedding = await generateEmbedding(
//       query.trim(),
//       "query"
//     );

//     // 2. Find the closest testimonial embeddings.
//     const results = await prisma.$queryRaw`
//       SELECT
//         id,
//         client_name,
//         summary,
//         transcript,
//         sentiment,
//         industry,
//         keywords,
//         confidence_score,
//         created_at,
//         1 - (embedding <=> ${queryEmbedding}::vector(768)) AS similarity
//       FROM "Testimonial"
//       WHERE user_id = ${userId}
//         AND embedding IS NOT NULL
//         AND status = 'completed'
//       ORDER BY embedding <=> ${queryEmbedding}::vector(768)
//       LIMIT ${limit}
//     `;

//     // 3. Transform database rows into the API response format.
//     const formattedResults = (results as any[]).map((r) => ({
//       id: r.id,
//       clientName: r.client_name,
//       summary: r.summary,
//       transcript:
//         r.transcript?.substring(0, 300) +
//         (r.transcript?.length > 300 ? "..." : ""),
//       sentiment: r.sentiment,
//       industry: r.industry,
//       keywords: r.keywords,
//       confidenceScore: r.confidence_score,
//       similarity: Math.round(Number(r.similarity) * 1000) / 1000,
//       createdAt: r.created_at,
//     }));

//     return res.json({
//       query: query.trim(),
//       total: formattedResults.length,
//       results: formattedResults,
//     });
//   } catch (err) {
//     logger.error(
//       { err, query, userId },
//       "Search failed"
//     );

//     return res.status(500).json({
//       error: "Search failed",
//     });
//   }
// };

import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { generateEmbedding } from "../services/embedding.service";
import { logger } from "../config/logger";

export const searchTestimonials = async (req: Request, res: Response) => {
  const { query } = req.body;
  const userId = req.user?.id;
  const requestedLimit = Number(req.body.limit ?? 10);
  const threshold = Number(req.body.threshold ?? 0.5);

  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 50) {
    return res.status(400).json({ error: "limit must be an integer between 1 and 50" });
  }

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    return res.status(400).json({ error: "threshold must be between 0 and 1" });
  }

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "Query is required" });
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const queryEmbedding = await generateEmbedding(query.trim(), "query");
    const queryEmbeddingString = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw`
  SELECT
    id,
    client_name,
    summary,
    transcript,
    sentiment,
    industry,
    keywords,
    confidence_score,
    created_at,
    1 - (embedding <=> ${queryEmbeddingString}::vector) as similarity
  FROM "Testimonial"
  WHERE user_id = ${userId}
    AND embedding IS NOT NULL
    AND status = 'completed'
  ORDER BY embedding <=> ${queryEmbeddingString}::vector
  LIMIT ${requestedLimit}
`;

    const filtered = (results as any[])
      .map((r) => ({
        id: r.id,
        clientName: r.client_name,
        summary: r.summary,
        transcript:
          r.transcript?.substring(0, 300) +
          (r.transcript?.length > 300 ? "..." : ""),
        sentiment: r.sentiment,
        industry: r.industry,
        keywords: r.keywords,
        confidenceScore: r.confidence_score,
        similarity: Math.round(Number(r.similarity) * 1000) / 1000,
        createdAt: r.created_at,
      }))
      .filter((r) => r.similarity >= threshold);

    res.json({ query, total: filtered.length, results: filtered });
  } catch (err) {
    logger.error({ err, userId }, "Search failed");
    res
      .status(500)
      .json({ error: "Search failed" });
  }
};
