# Demo

https://cf-ai-agent-assistant.pages.dev/ 

# Cloudflare AI Agent Assistant

This is an AI-powered chatbot built 100% on Cloudflare's stack - demonstrating how you can build a production-ready, intelligent assistant using Workers AI, Durable Objects, Workers, and Pages. No external APIs, no separate backend servers - everything runs on Cloudflare's edge network.

## Technologies Used

This project leverages the following Cloudflare services:

- **Workers AI**: Runs the Llama 3.3 70B Instruct model for intelligent, context-aware responses
- **Cloudflare Workers**: Serverless compute that acts as the application's backend "brain"
- **Durable Objects**: Provides stateful storage for persistent chat history per user session
- **Cloudflare Pages**: Hosts the frontend chat interface with global CDN distribution

## Features

- Real-time AI-powered chat interface
- Persistent conversation history using Durable Objects
- Session-based memory (remembers context within a conversation)
- Beautiful, responsive UI with gradient design
- Clear chat history functionality
- Automatic session management
- CORS-enabled API for frontend communication

## Project Structure

```
cf_ai_agent_assistant/
├── src/
│   ├── index.ts          # Main Worker (backend coordinator)
│   └── memory.ts         # Durable Object for chat memory
├── public/
│   └── index.html        # Frontend chat interface
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── README.md             # This file
└── PROMPTS.md           # AI prompts used to build this project
```

## 🛠️ Deployment Instructions

Follow these steps to deploy your own instance of the Cloudflare AI Agent Assistant:

### Prerequisites

1. A Cloudflare account (free tier works!)
2. Node.js and npm installed on your machine
3. Basic familiarity with the terminal/command line

### Step 1: Clone and Install Dependencies

```bash
# Navigate to the project directory
cd cf_ai_agent_assistant

# Install dependencies
npm install
```

### Step 2: Set Up Your Cloudflare Workers.dev Subdomain

This is a one-time setup per Cloudflare account:

1. Visit https://dash.cloudflare.com/
2. Log in to your Cloudflare account
3. Navigate to "Workers & Pages" in the left sidebar
4. Choose your desired `workers.dev` subdomain (e.g., `yourname.workers.dev`)

### Step 3: Deploy the Worker Backend

```bash
npm run deploy
```

After successful deployment, you'll see output showing your Worker URL:
```
Published cf-ai-agent-assistant
  https://cf-ai-agent-assistant.your-subdomain.workers.dev
```

**Important**: Copy this URL! You'll need it for the next step.

### Step 4: Configure the Frontend

Edit `public/index.html` and update line 265 with your Worker URL:

```javascript
// Replace this line:
const WORKER_URL = 'https://cf-ai-agent-assistant.YOUR-SUBDOMAIN.workers.dev';

// With your actual Worker URL:
const WORKER_URL = 'https://cf-ai-agent-assistant.your-subdomain.workers.dev';
```

### Step 5: Deploy the Frontend to Cloudflare Pages

```bash
npm run deploy-pages
```

When prompted:
- **Project name**: Enter `cf-ai-agent-assistant` (must be lowercase with dashes, no spaces)
- **Production branch**: Enter `main` or `production`

After deployment, you'll receive a Pages URL like:
```
https://cf-ai-agent-assistant.pages.dev
```

### Step 6: Test Your Application

Visit your Cloudflare Pages URL and start chatting with your AI assistant!

## Local Development

To test the application locally before deploying:

### Start the Worker locally:
```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

### Open the frontend:
Open `public/index.html` in your browser. The frontend automatically uses `localhost:8787` when running locally.

## How It Works

### Architecture Flow

1. **User sends a message** through the frontend chat interface
2. **Frontend makes a POST request** to `/chat` endpoint on the Worker
3. **Worker retrieves the Durable Object** for the user's session
4. **Durable Object returns chat history** (previous messages)
5. **Worker appends the new message** and sends everything to Workers AI
6. **Workers AI (Llama 3.3 70B)** generates a contextual response
7. **Worker saves the response** to the Durable Object
8. **Frontend displays** the AI's response to the user

### Key Components

#### Main Worker (`src/index.ts`)
- Handles incoming HTTP requests
- Manages session IDs (based on IP or provided sessionId)
- Coordinates between Durable Objects and Workers AI
- Provides `/chat` and `/clear` endpoints
- Includes CORS headers for frontend communication

#### Durable Object (`src/memory.ts`)
- Stores chat messages with timestamps
- Provides `/add`, `/history`, and `/clear` endpoints
- Ensures strongly consistent storage per session
- Persists data across Worker invocations

#### Frontend (`public/index.html`)
- Single-page chat application
- Real-time message display with animations
- Session persistence using localStorage
- Responsive design with gradient UI
- Loading indicators for better UX

## API Endpoints

### `POST /chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "What is Cloudflare Workers?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "message": "Cloudflare Workers allows you to run JavaScript...",
  "sessionId": "session-abc123"
}
```

### `POST /clear`
Clear the chat history for a session.

**Request:**
```json
{
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat history cleared"
}
```

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Cloudflare AI Ticket Assistant is running",
  "endpoints": {
    "chat": "/chat",
    "clearHistory": "/clear"
  }
}
```

## Customization

### Change the AI Model
Edit `src/index.ts` line 127 to use a different model:
```typescript
const aiResponse = await env.AI.run(
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Change this
  { /* ... */ }
);
```

Available models: https://developers.cloudflare.com/workers-ai/models/

### Customize the System Prompt
Edit the `CLOUDFLARE_FAQ` constant in `src/index.ts` (lines 19-45) to change the AI's knowledge base and behavior.

### Modify the UI
Edit `public/index.html` to customize colors, layout, and functionality. The CSS uses gradient themes that can be easily adjusted.

## Troubleshooting

### "Durable Objects migration error"
Make sure your `wrangler.toml` uses `new_sqlite_classes` instead of `new_classes`:
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["AiMemory"]
```

### "Workers.dev subdomain required"
Visit the Workers dashboard at least once to set up your subdomain.

### "API URL not configured"
Update line 265 in `public/index.html` with your actual Worker URL after deployment.

### "CORS errors"
Ensure your Worker URL matches exactly what you configured in the frontend.