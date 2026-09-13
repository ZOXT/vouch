# Vouch — System Architecture

**Vouch** is a testimonial collection platform. Owners create campaigns or one-time
requests, share public links, and collect **video or text testimonials**. Uploads run
through an asynchronous pipeline (validation → thumbnails → transcription → captions →
AI analysis → embeddings) and can be published as **iframe-based embeddable walls** on the
owner's own website.

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite, React Router, Tailwind CSS |
| API | Node.js + Express 5, Zod v4 validation, JWT auth, Pino logging |
| Database | PostgreSQL (Supabase) via Prisma, `pgvector` for semantic search |
| Queue | Redis + BullMQ (4 workers: media · transcription · ai · embedding) |
| Media | AWS S3 (presigned uploads) + CloudFront delivery, ffmpeg in the media worker |
| AI | Groq (`whisper-large-v3` transcription, GPT-OSS-120B analysis) + self-hosted BGE-base embedding service |
| Email | Resend (transactional: OTP, notification) |
| Billing | Paddle (SDK webhooks — signature + IP-allowlist verified server-side) |
| Edge | Caddy 2 reverse proxy (marketing apex / app subdomain split, TLS) |

---

## System architecture

```mermaid
flowchart TB
    user(["Visitors · Clients · Owners"])

    subgraph Edge["Edge (Caddy 2 · TLS · host routing)"]
        caddy["tryvouch.me → marketing · app.tryvouch.me → SPA<br/>/api/* · /embed/* → API  ·  www→apex canonical"]

    end

    subgraph Web["Public web"]
        spa["React SPA (single bundle)<br/>landing/pricing/legal on apex, app shell on app.*<br/>session shared via COOKIE_DOMAIN + HostCanonicalGuard"]
        embed["Server-rendered embed pages<br/>/embed/:publicId wall · player iframes · WebVTT captions<br/>embed.js loader posts origin-verified messages"]
    end

    subgraph Api["API — Express 5 (TypeScript)"]
        api["REST /api/v1<br/>JWT 15m access + rotating 30d refresh (httpOnly cookies)<br/>Zod v4 validation · rate limiting · Pino logging"]
    end

    subgraph Pipeline["Async pipeline — BullMQ on Redis"]
        mwk["media worker<br/>ffmpeg: validate → thumbnails"]
        twk["transcription worker<br/>Groq whisper → transcript + WebVTT captions"]
        awk["ai worker<br/>Groq GPT-OSS-120B → sentiment / industry / outcomes"]
        ewk["embedding worker<br/>calls embedding-service → writes pgvector"]
    end

    subgraph Services["Services & storage"]
        pg[("Supabase PostgreSQL<br/>+ pgvector 768-d<br/>(Prisma)")]
        redis[("Redis<br/>queues + cache")]
        s3["AWS S3<br/>presigned uploads"]
        cf["CloudFront<br/>media delivery"]
        esvc["embedding-service<br/>FastAPI · BGE-base 768-d"]
        groq["Groq<br/>whisper / GPT-OSS"]
        resend["Resend<br/>transactional email"]
        paddle["Paddle<br/>subscriptions & payments"]
    end

    user --> caddy
    caddy --> spa
    caddy --> api
    caddy --> embed

    spa --> api
    embed --> cf
    embed --> pg

    api --> pg
    api --> redis
    api --> s3
    api --> resend
    api --> paddle

    redis --> mwk
    redis --> twk
    redis --> awk
    redis --> ewk

    mwk --> s3
    twk --> s3
    twk --> groq
    awk --> groq
    ewk --> esvc
    esvc --> pg
    cf --> s3
```

---

## Testimonial submission pipeline

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (browser)
    participant A as Express API
    participant S as AWS S3
    participant R as Redis / BullMQ
    participant M as media worker
    participant T as transcription worker
    participant G as Groq
    participant X as ai worker
    participant SV as embedding-service
    participant E as embedding worker
    participant P as Postgres + pgvector

    C->>A: POST presigned upload (file type/size)
    A-->>C: { uploadUrl, key }
    C->>S: PUT video directly to S3
    C->>A: confirm testimonial upload { key, consent: true }
    A->>P: insert Testimonial (consent_given, status=uploaded)
    A->>R: enqueue media job

    R->>M: process media
    M->>S: read source video
    M->>M: ffmpeg — validate codec/audio, extract thumbnail
    M->>S: store thumbnail
    M->>P: status=available
    M->>R: enqueue transcription job

    R->>T: process transcription
    T->>S: fetch video
    T->>G: whisper-large-v3 (verbose_json)
    G-->>T: segments + transcript
    T->>S: store captions/{id}.vtt (+ transcript)
    T->>P: transcript + captions_key
    Note over T: Caption failures never fail the job
    T->>R: enqueue ai + embedding jobs

    R->>X: analyze
    X->>G: GPT-OSS-120B analysis prompt
    G-->>X: sentiment / industry / pain points / outcomes / objections / keywords
    X->>P: store analysis fields + confidence

    R->>E: embed
    E->>SV: POST /embed (document)
    SV-->>E: 768-d normalized vector
    E->>P: UPDATE embedding = '[...]'::vector

    C->>A: GET /search?q=...
    A->>SV: POST /embed (query, instruction prefix)
    SV-->>A: query vector
    A->>P: ORDER BY embedding <=> query::vector
    P-->>A: ranked testimonials
    A-->>C: results (thumbnail + video playback + transcript)
```

---

## Notable decisions

- **Asynchronous everything.** Uploads are confirmed instantly; heavy work (ffmpeg,
  transcription, AI, embeddings) runs on isolated BullMQ workers so the API stays fast and
  failures are retried or dead-lettered (DLQ tooling included).
- **Clipboard-safe embeds.** Publishers drop a small `embed.js` loader that injects an
  iframe pointing at server-rendered pages. Card clicks `postMessage` to the parent, which
  opens a lightbox player with a custom WebVTT caption overlay. Caddy+iframe security uses
  `frame-ancestors` from the embed's `allowed_domains` (empty = anywhere may frame).
- **Semantic search, not just keywords.** Transcripts + AI analysis are embedded with a
  self-hosted `bge-base` model and searched via `pgvector` cosine distance right in the
  primary Postgres instance — no separate vector database to operate.
- **Domain split.** One SPA bundle serves both the marketing apex (`tryvouch.me`) and the
  app (`app.tryvouch.me`); a shared cookie domain keeps one session across hosts and a
  server + client canonical guard keeps every URL on the correct host.
- **Provider-agnostic billing.** Entitlements derive from a normalized
  `Subscription { plan, status }` model backed by Paddle; webhooks are unmarshalled with the
  official SDK, signature-verified, and IP-allowlisted before they map to a user.
- **Email reliability split.** OTP email *throws* on failure (login must not silently
  break); notification emails are fire-and-forget and must never block business operations.