# AI UI Tutor

Monorepo scaffold for an app that accepts a UI screenshot, asks OpenAI to identify the interaction steps, and returns the original image with numbered guidance drawn on top.

## Structure

```text
.
|-- ai_services/          # OpenAI vision prompt and response parsing
|-- backend/              # FastAPI API and image annotation renderer
|-- frontend/             # Next.js user interface
|-- docker-compose.yml
`-- .env.example
```

## Run with Docker

```bash
cp .env.example .env
# edit OPENAI_API_KEY in .env
# OPEN_AI_KEY and OPEN_API_KEY are also supported if you already use those local names
docker compose up --build
```

Frontend: http://localhost:3000

Backend health check: http://localhost:8000/health

API health check: http://localhost:8000/api/health

## API

`POST /api/analyze`

Form fields:

- `file`: image file
- `user_goal`: optional instruction describing what the user wants to do

Response includes detected steps and `annotated_image_data_url`, a PNG data URL that the frontend can render directly.

Default model: `gpt-5.4-mini`. Override it with `OPENAI_MODEL` in `.env`.

Each returned step includes:

- `action`
- `target_type`
- `label`
- `description`
- `x`, `y`, `width`, `height`
- `confidence`
