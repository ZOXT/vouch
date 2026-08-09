from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from sentence_transformers import SentenceTransformer
from fastapi.concurrency import run_in_threadpool
from contextlib import asynccontextmanager
import uvicorn

model = None
QUERY_INSTRUCTION = "Represent this query for retrieving relevant passages: "

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model

    print("Loading BGE-base model...")
    model = SentenceTransformer("BAAI/bge-base-en-v1.5")
    print("Model loaded! 768-dim embeddings ready.")

    yield

    print("Shutting down embedding service...")

app = FastAPI(
    title="Vouch Embedding Service",
    lifespan=lifespan
)

class EmbedRequest(BaseModel):
    texts: list[str] = Field(max_length=100)
    type: Literal["document", "query"] = "document"

class EmbedResponse(BaseModel):
    embeddings: list[list[float]]

def embed_documents(texts: list[str]) -> list[list[float]]:
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True
    )
    return embeddings.tolist()

def embed_queries(texts: list[str]) -> list[list[float]]:
    prefixed = [QUERY_INSTRUCTION + t for t in texts]
    embeddings = model.encode(
        prefixed,
        normalize_embeddings=True,
        convert_to_numpy=True
    )
    return embeddings.tolist()

# routes
@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    if not req.texts:
        raise HTTPException(status_code=400, detail="No texts provided")

    if req.type == "query":
        embeddings = await run_in_threadpool(embed_queries, req.texts)
    else:
        embeddings = await run_in_threadpool(embed_documents, req.texts)

    return EmbedResponse(embeddings=embeddings)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "BAAI/bge-base-en-v1.5",
        "dimensions": 768,
        "cached": model is not None,
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
