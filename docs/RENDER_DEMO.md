# Render Demo Edition

The public Render service is intentionally a lightweight demonstration edition designed for the free 512 MB plan.
It starts from `app.demo_main:app` and installs `backend/requirements-demo.txt`, so it never imports or installs the
local ML stack used by the full self-hosted edition.

## Included

- Spotify authentication, profile, top tracks, and top artists
- Playlist browsing and Playlist Architect
- Gemini-powered Music Critic
- Lightweight Taste Insights
- Route Playlist generation
- Skip Predictor

## Full self-hosted edition only

- Semantic recommendations and embeddings
- Sound Map clustering
- Similarity search
- PyTorch, Sentence Transformers, scikit-learn, and local ML inference

Disabled API routes return HTTP `503` with a message explaining that the feature is available in the full edition.
`GET /api/v1/health` and `GET /api/v1/edition` identify the running edition programmatically.

## Deployment

Create a Render Blueprint from the repository-root `render.yaml`, then provide the environment variables marked
`sync: false` in the Render dashboard. The full backend remains unchanged and continues to start from
`app.main:app` when hosted locally.
