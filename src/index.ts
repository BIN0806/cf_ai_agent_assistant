import { AiMemory } from './memory';

export { AiMemory };

// Environment bindings interface
export interface Env {
  AI: Ai;
  AI_MEMORY: DurableObjectNamespace;
}

// CORS headers for frontend communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Sample Cloudflare FAQ context for the AI
const CLOUDFLARE_FAQ = `
You are a helpful Cloudflare support assistant. You help users with questions about Cloudflare products and services.

Common Cloudflare Products:
- Workers: Serverless code that runs on Cloudflare's edge network
- Pages: Fast, secure sites and apps deployed directly from your git provider
- Workers AI: Run machine learning models on Cloudflare's network
- Durable Objects: Stateful objects with strongly consistent storage
- R2: S3-compatible object storage without egress fees
- KV: Low-latency key-value storage
- D1: Serverless SQL database

Common Questions:
Q: What is Cloudflare Workers?
A: Cloudflare Workers allows you to run JavaScript, TypeScript, or other languages at the edge, close to your users. It's serverless and scales automatically.

Q: How does Workers AI work?
A: Workers AI lets you run AI models directly on Cloudflare's network. You can run LLMs, image models, and more without managing infrastructure.

Q: What are Durable Objects?
A: Durable Objects provide low-latency coordination and consistent storage for Workers. Each object has a single source of truth and strongly consistent storage.

Q: What's the difference between Workers and Pages?
A: Workers is for backend logic and APIs, while Pages is for deploying static sites and full-stack applications. Pages can use Workers for backend functionality.

Answer user questions clearly and concisely based on this information and your knowledge of Cloudflare products.
`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'Cloudflare AI Ticket Assistant is running',
          endpoints: {
            chat: '/chat',
            clearHistory: '/clear'
          }
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Chat endpoint
    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const { message, sessionId } = await request.json() as { message: string; sessionId?: string };

        if (!message) {
          return new Response(
            JSON.stringify({ error: 'Message is required' }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
              } 
            }
          );
        }

        // Generate user ID from IP or use provided sessionId
        const userIP = request.headers.get('CF-Connecting-IP') || 'anonymous';
        const userId = sessionId || userIP;

        // Get Durable Object stub for this user
        const id = env.AI_MEMORY.idFromName(userId);
        const stub = env.AI_MEMORY.get(id);

        // Get chat history
        const historyResponse = await stub.fetch('http://internal/history');
        const { history } = await historyResponse.json() as { 
          history: Array<{ role: string; content: string; timestamp: number }> 
        };

        // Add user message to history
        await stub.fetch('http://internal/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: message })
        });

        // Format messages for AI (only role and content, no timestamp)
        const formattedHistory = history.map(({ role, content }) => ({ role, content }));
        formattedHistory.push({ role: 'user', content: message });

        // Prepare system message with FAQ context
        const messages = [
          { role: 'system', content: CLOUDFLARE_FAQ },
          ...formattedHistory
        ];

        // Call Workers AI
        const aiResponse = await env.AI.run(
          '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
          {
            messages,
            max_tokens: 1024,
            temperature: 0.7
          }
        ) as { response?: string };

        const assistantMessage = aiResponse.response || 'I apologize, but I was unable to generate a response.';

        // Save assistant response to history
        await stub.fetch('http://internal/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: assistantMessage })
        });

        return new Response(
          JSON.stringify({ 
            message: assistantMessage,
            sessionId: userId
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      } catch (error) {
        console.error('Error processing chat:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process chat message',
            details: error instanceof Error ? error.message : 'Unknown error'
          }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    }

    // Clear history endpoint
    if (url.pathname === '/clear' && request.method === 'POST') {
      try {
        const { sessionId } = await request.json() as { sessionId?: string };
        
        const userIP = request.headers.get('CF-Connecting-IP') || 'anonymous';
        const userId = sessionId || userIP;

        const id = env.AI_MEMORY.idFromName(userId);
        const stub = env.AI_MEMORY.get(id);

        await stub.fetch('http://internal/clear', { method: 'POST' });

        return new Response(
          JSON.stringify({ success: true, message: 'Chat history cleared' }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to clear history' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    }

    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  },
};

