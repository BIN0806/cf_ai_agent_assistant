// Durable Object for storing chat history per user session
export class AiMemory implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  // Fetch handler for the Durable Object
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/add" && request.method === "POST") {
      const { role, content } = await request.json() as { role: string; content: string };
      await this.addMessage(role, content);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (url.pathname === "/history" && request.method === "GET") {
      const history = await this.getHistory();
      return new Response(JSON.stringify({ history }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/clear" && request.method === "POST") {
      await this.state.storage.delete("messages");
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not found", { status: 404 });
  }

  // Add a message to the chat history
  private async addMessage(role: string, content: string): Promise<void> {
    const messages = await this.getHistory();
    messages.push({ role, content, timestamp: Date.now() });
    await this.state.storage.put("messages", messages);
  }

  // Retrieve the entire chat history
  private async getHistory(): Promise<Array<{ role: string; content: string; timestamp: number }>> {
    const messages = await this.state.storage.get("messages");
    return messages || [];
  }
}

