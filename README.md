# HireFlow AI

HireFlow AI is an interview preparation and hiring-process intelligence platform. It helps candidates track company hiring pipelines, prepare by stage, search likely interview questions, learn from shared interview experiences, and get personalized AI guidance powered by Google Gemini.

The project is built as a full-stack JavaScript application with a React/Vite frontend, an Express/MongoDB backend, optional Razorpay subscription enforcement, and Docker Compose support for local production-like runs.

## Features

- JWT-based authentication with registration, login, profile loading, and onboarding.
- Subscription-aware access control with Razorpay integration and a local demo bypass mode.
- Hiring process tracking by company, role, current stage, timeline, notes, stage history, and logged questions.
- AI-generated preparation roadmaps for each hiring process.
- Question bank with company, role, stage, topic, pattern, difficulty, frequency, and external links.
- Question activity tracking for solved, skipped, and bookmarked questions.
- RAG-based AI agent that uses the user's active process and relevant question context.
- Mock interview generation focused on weak topics and current hiring stage.
- Public interview experience feed with structured rounds, outcomes, topics, tips, and insights.
- Dashboard analytics for active processes, outcomes, performance, predictions, and time plans.
- Seed utilities for interview questions and public interview experiences.
- Dockerized frontend, backend, and MongoDB stack.

## Tech Stack

**Frontend**

- React 19
- Vite
- React Router
- Zustand
- Axios
- Tailwind CSS
- Recharts
- React Hot Toast
- Lucide React

**Backend**

- Node.js 20+
- Express
- MongoDB with Mongoose
- JWT authentication
- Google Gemini API
- Razorpay subscriptions
- MongoDB text search locally
- MongoDB Atlas Vector Search for production RAG

**Infrastructure**

- Docker
- Docker Compose
- Nginx for serving the production frontend and proxying `/api`

## Project Structure

```text
HireFlow-AI/
|-- backend/
|   |-- config/          # MongoDB connection
|   |-- controllers/     # Route handlers and business workflows
|   |-- middleware/      # Auth, subscription, onboarding, error handling
|   |-- models/          # Mongoose models
|   |-- routes/          # Express route definitions
|   |-- services/        # Gemini, RAG, embeddings, Razorpay, pattern logic
|   |-- utils/           # Shared backend helpers
|   |-- seed.js          # Question seed script with optional embeddings
|   `-- server.js        # Express app entrypoint
|-- frontend/
|   |-- src/
|   |   |-- api/         # Axios client
|   |   |-- components/  # Layout, process, and UI components
|   |   |-- hooks/       # Reusable frontend hooks
|   |   |-- pages/       # App screens
|   |   |-- store/       # Zustand stores
|   |   `-- utils/       # Frontend helpers
|   |-- nginx.conf       # Production nginx config
|   `-- Dockerfile
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB, either local or MongoDB Atlas
- Docker and Docker Compose, if using the containerized setup
- Google Gemini API key for AI features
- Razorpay account and subscription plan, only if payment enforcement is enabled

## Environment Variables

The root `.env.example` is designed for Docker Compose:

```env
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=7d
BYPASS_PAYMENT=true
GEMINI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID=
RAZORPAY_WEBHOOK_SECRET=
```

For standalone backend development, use `backend/.env.example` as the template:

```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/hireflow-ai
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
RAZORPAY_PLAN_ID=plan_your_plan_id_here
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:8000
BYPASS_PAYMENT=true
```

Important notes:

- Keep `BYPASS_PAYMENT=true` for local demos without Razorpay.
- Set `BYPASS_PAYMENT=false` in production if users must have active subscriptions.
- `GEMINI_API_KEY` is required for AI roadmaps, predictions, chat, mock interviews, experience extraction, and embeddings.
- `JWT_SECRET` should be a long random value in every non-demo environment.

## Run With Docker

From the repository root:

```sh
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8000/health`
- MongoDB: `localhost:27017`

The Compose stack starts:

- `frontend`: React production build served by nginx on port `3000`
- `backend`: Express API on port `8000`
- `mongo`: MongoDB 7 with persistent data in the `mongo_data` volume

## Run Locally Without Docker

Start MongoDB locally or use MongoDB Atlas, then create the backend environment file:

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

In a second terminal, start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

During local frontend development, Vite proxies `/api` to `http://localhost:8000`. For a custom API URL, set `VITE_API_BASE_URL` before building or running the frontend.

## Seeding Data

The backend includes a seed script for interview questions:

```sh
cd backend
npm run seed
```

The script inserts a curated question bank. If `GEMINI_API_KEY` is present, it also generates embeddings for semantic search.

There are also authenticated seed endpoints:

- `POST /api/seed/questions`
- `POST /api/seed/experiences`
- `POST /api/seed/company`

These endpoints require a valid JWT.

## API Overview

Base path: `/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/onboarding`
- `GET /auth/me`

### Payments

- `POST /payment/webhook`
- `POST /payment/verify`
- `GET /payment/subscription`
- `POST /payment/cancel`

### Hiring Processes

- `POST /process`
- `GET /process`
- `GET /process/:id`
- `PATCH /process/:id/stage`
- `DELETE /process/:id`
- `POST /process/:id/questions`
- `GET /process/:id/questions`
- `POST /process/:id/roadmap`

### Questions

- `GET /questions`
- `GET /questions/search`
- `GET /questions/:id`
- `POST /questions`
- `POST /questions/:id/activity`

### Experiences

- `GET /experiences`
- `GET /experiences/feed`
- `GET /experiences/insights`
- `POST /experiences`

### AI Agent

- `POST /agent/chat`
- `GET /agent/history/:processId`
- `POST /agent/mock-interview`

### Dashboard

- `GET /dashboard/overview`
- `GET /dashboard/performance`
- `GET /dashboard/predict?processId=...`
- `GET /dashboard/time-plan?processId=...&days=...`

Most application routes require:

1. A valid JWT.
2. Active subscription status, unless `BYPASS_PAYMENT=true`.
3. Completed onboarding.

## AI and Search Behavior

HireFlow AI uses Gemini for:

- Roadmap generation
- Interview experience extraction
- Experience insight generation
- Context-aware AI chat
- Interview pattern prediction
- Mock interview generation
- Embedding generation

For RAG search:

- In `development`, the backend uses MongoDB text search as a local fallback.
- In production, it attempts MongoDB Atlas Vector Search using the `questions.embedding` field.
- If Atlas Vector Search is unavailable, the service falls back to text search where possible.

To enable Atlas Vector Search, create an index named `vector_index` on the `questions` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

## Razorpay Setup

Payment enforcement is optional during local development.

For production subscription mode:

1. Create a Razorpay subscription plan.
2. Set `BYPASS_PAYMENT=false`.
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, and `RAZORPAY_WEBHOOK_SECRET`.
4. Configure the Razorpay webhook URL:

```text
https://your-domain.com/api/payment/webhook
```

The backend verifies Razorpay payment and webhook signatures before activating users.

## Available Scripts

Backend:

```sh
npm run dev      # Start backend with nodemon
npm start        # Start backend with node
npm run seed     # Seed questions and optional embeddings
```

Frontend:

```sh
npm run dev      # Start Vite dev server
npm run build    # Build production frontend
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Deployment Notes

- Build the frontend with `VITE_API_BASE_URL=/api` when the same domain proxies API requests.
- The included `frontend/nginx.conf` serves the React app and proxies `/api` plus `/health` to the backend service.
- Use MongoDB Atlas for production data and vector search.
- Set strong secrets and disable payment bypass outside demo environments.
- Restrict CORS through `CLIENT_URL`.
- Configure HTTPS before using Razorpay webhooks in production.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
