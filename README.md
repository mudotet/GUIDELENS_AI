# AI UI Tutor

AI UI Tutor is a one-page demo app that helps users understand what to do on a UI screenshot.

The user uploads a screenshot and enters a question or goal. The backend sends the image to OpenAI, asks the model to identify useful UI actions, and receives step-by-step guidance with pixel coordinates. The backend then draws those steps directly onto the original image and returns a new annotated output image.

## Main Features

- Upload a UI screenshot from the frontend.
- Enter a question or task goal.
- Use AI to analyze the screenshot and identify interaction steps.
- Draw numbered boxes and labels on top of the uploaded image.
- View both the input image and the annotated output image.
- Inspect the returned action steps and coordinates.
- Run the full app with Docker Compose.

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS.
- Backend: FastAPI, Python.
- AI service: OpenAI vision model.
- Image rendering: Pillow.
- Runtime: Docker Compose with separate frontend and backend services.

## Project Structure

```text
.
|-- ai_services/
|   |-- openai_vision.py     # Calls OpenAI to analyze screenshots
|   |-- prompts.py           # Prompt for JSON steps and coordinates
|   `-- schemas.py           # Pydantic schemas for AI output
|
|-- backend/
|   |-- app/
|   |   |-- api/routes/      # FastAPI routes
|   |   |-- core/            # Environment configuration
|   |   |-- schemas/         # API response schemas
|   |   `-- services/        # Image overlay rendering
|   |-- Dockerfile
|   `-- requirements.txt
|
|-- frontend/
|   |-- app/                 # Next.js app router
|   |-- Dockerfile
|   |-- package.json
|   |-- tailwind.config.ts
|   `-- postcss.config.js
|
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## How It Works

1. The user opens `http://localhost:3000`.
2. The user uploads a UI screenshot.
3. The user enters a question or goal.
4. The frontend calls `POST /api/analyze`.
5. The backend reads the image, gets its size, and sends it to OpenAI.
6. OpenAI returns JSON containing labels, descriptions, actions, and coordinates.
7. The backend uses Pillow to draw guidance overlays on the original image.
8. The frontend displays the annotated output image and the step list.

## Environment Setup

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-5.5-pro

BACKEND_PORT=8000
FRONTEND_PORT=3000

CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The backend also supports these alternative API key names:

```env
OPEN_AI_KEY=sk-your-openai-api-key
OPEN_API_KEY=sk-your-openai-api-key
```

## Run With Docker

Build and start the app:

```bash
docker compose up --build
```

After startup:

- Frontend: http://localhost:3000
- Backend health check: http://localhost:8000/health
- API health check: http://localhost:8000/api/health

Run in the background:

```bash
docker compose up -d --build
```

Stop the app:

```bash
docker compose down
```

## Backend API

### `GET /health`

Checks whether the backend is running.

Response:

```json
{
  "status": "ok"
}
```

### `GET /api/health`

Checks whether the API is running and which model is configured.

Response:

```json
{
  "status": "ok",
  "model": "gpt-5.5-pro"
}
```

### `POST /api/analyze`

Analyzes a screenshot and returns an annotated output image.

Form data:

- `file`: the uploaded image file.
- `user_goal`: the user question or goal.

Main response fields:

```json
{
  "source_filename": "screen.png",
  "image_width": 1440,
  "image_height": 900,
  "image_mime_type": "image/png",
  "model_used": "gpt-5.5-pro",
  "summary": "Short summary of the suggested flow",
  "steps": [],
  "warnings": [],
  "original_image_data_url": "data:image/png;base64,...",
  "annotated_image_data_url": "data:image/png;base64,..."
}
```

Each item in `steps` looks like this:

```json
{
  "order": 1,
  "action": "click",
  "target_type": "button",
  "label": "Continue",
  "description": "Click Continue to move to the next step",
  "x": 120,
  "y": 240,
  "width": 180,
  "height": 48,
  "confidence": 0.86
}
```

## Frontend

The frontend currently has one demo page:

- Upload an input screenshot.
- Enter a question or goal.
- View the annotated output image.
- Switch between the input and output images.
- Inspect the returned steps and coordinates.

Current theme:

- Primary background: `#DEE2F2`
- Secondary background: `#F5F5F5`
- Button color: `#E48C3A`
- Font: Roboto

## Quick Checks

Check the backend:

```bash
curl http://localhost:8000/api/health
```

Build the frontend and run TypeScript checks:

```bash
docker compose exec frontend npm run build
```

Compile Python files:

```bash
python3 -m compileall backend ai_services
```

## Common Issues

### The frontend cannot call the backend

Check `NEXT_PUBLIC_API_BASE_URL` in `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

After editing `.env`, rebuild and restart:

```bash
docker compose up -d --build
```

### The backend says the API key is missing

Make sure `.env` contains one of these variables:

```env
OPENAI_API_KEY=...
OPEN_AI_KEY=...
OPEN_API_KEY=...
```

### The returned coordinates are not accurate

This demo depends on the model's visual understanding of the screenshot. You can improve results by:

- Uploading a clearer screenshot.
- Writing a more specific goal.
- Tuning the prompt in `ai_services/prompts.py`.
- Adjusting the renderer in `backend/app/services/image_renderer.py`.

## Notes

This version is a single-page demo. It does not include authentication, user accounts, a database, or Supabase. The goal is to demonstrate the full flow: input screenshot -> AI analysis -> action coordinates -> annotated output image.
