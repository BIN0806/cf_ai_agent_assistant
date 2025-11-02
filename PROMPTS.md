# PROMPTS.md

This file contains all the prompts used to build the Cloudflare AI Agent Assistant project with AI assistance.

---

## Initial Project Prompt

```
Project Goal: You are an expert developer specializing in the Cloudflare stack. Your task is to guide me, step-by-step, in building a complete AI-powered application for a Cloudflare internship assignment.

This application must be built entirely on the Cloudflare platform and must meet all specific technical and documentation requirements.

Project Idea: We will build a "Cloudflare Agent Assistant." This will be a simple chat application where a user can ask questions about Cloudflare products. The AI will answer the questions and use memory to remember the conversation's context.

Core Technical Requirements

You must use the following Cloudflare services:

LLM: Cloudflare Workers AI to run the Llama 3.3 model (or a similar suitable chat model) for generating responses.

Workflow & Coordination: A central Cloudflare Worker will act as the "brain." It will receive messages from the user, call the Workers AI LLM, and coordinate with the memory component.

Memory / State: We will use Durable Objects to store the chat history for each user, giving the assistant memory.

User Input (Frontend): A simple chat interface built with HTML, CSS, and JavaScript, deployed as a Cloudflare Pages project. This frontend will communicate with our Worker.

Crucial Documentation Requirements

This is the most important part. The final project structure must include:

Repository Name: All code should be structured as if it's in a repository named cf_ai_agent_assistant.



Let's Begin: Our Step-by-Step Plan

Please guide me through these steps one at a time. Do not move to the next step until we have completed the current one.

Step 1: Project Setup and wrangler.toml Provide the initial project structure and the complete wrangler.toml file. This file needs to:

Define the main Worker script.

Define the Durable Object binding for our memory (AI_MEMORY).

Set up the project for deployment.

Step 2: The Durable Object (Memory) Provide the complete TypeScript/JavaScript code for the Durable Object class (AiMemory). This class needs to:

Have a method to add a new message (both from the "user" and "assistant") to its internal state (e.g., an array).

Have a method to retrieve the entire chat history.

Step 3: The Cloudflare Worker (Brain) Provide the complete TypeScript/JavaScript code for the main Worker (index.ts). This Worker needs to:

Handle fetch requests (our chat messages).

Get the Durable Object stub for the current user (e.im., based on an IP or a session ID).

Fetch the existing chat history from the Durable Object.

Append the new user message to the history.

Format the entire history and send it to the Workers AI Llama 3.3 model.

Get the LLM's response.

Save the LLM's response to the Durable Object's history.

Send the LLM's response back to the frontend.

Step 4: The Cloudflare Pages Frontend (Chat UI) Provide the complete code for a single index.html file. This file should contain:

Simple HTML for a chat box and an input field.

JavaScript to:

Get the user's message on "submit."

fetch our deployed Worker's endpoint with the message.

Display the user's message and the AI's response in the chat box.

```
