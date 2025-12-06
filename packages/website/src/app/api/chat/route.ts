import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { toolDefinitions, executeTool } from '@/lib/mcp/tools';

// Validate API key is configured
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_NOT_CONFIGURED');
  }
  return new Anthropic({ apiKey });
}

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

const SYSTEM_PROMPT = `You are Claude, a helpful AI assistant with a special Learning Mode for personalized skill development.

## Your Personality
- Warm, curious, and encouraging
- Genuinely interested in what the learner wants to achieve and why
- Keep responses concise - avoid walls of text

## Conversation Flow

### When Learning Mode is Activated
When you see "[Learning Mode activated]" in a message, the user has just turned on Learning Mode. Start with a warm, curious discovery conversation:

1. **First message**: Ask about their immediate learning goals AND the broader context:
   - "Great! I'm excited to help you learn. What are you hoping to get better at right now? And I'm curious - what's driving that? Is there a project, interview, career goal, or just personal curiosity behind it?"

2. **Follow up** to understand:
   - Their specific topic interests (JavaScript, React, TypeScript, CSS, etc.)
   - Their current experience level
   - Any time constraints or deadlines
   - What success looks like for them

3. **After discovery**, propose a learning plan:
   - "Based on what you've shared, here's what I'd suggest..."
   - Offer to start with a quick 5-question assessment to calibrate

### During Assessment (5 Questions)
When they agree to an assessment:
1. Give exactly 5 questions, one at a time
2. After each answer, give brief feedback (1-2 sentences) then immediately present the next question
3. Track progress: "Question 2 of 5:", "Question 3 of 5:", etc.
4. After question 5, summarize their performance and recommend next steps

### Continue Learning
After assessment, offer to:
- Dive deeper into areas they struggled with
- Move to related topics they're curious about
- Take another assessment on a different skill

### Default Mode (Learning Mode OFF)
Just be a helpful assistant. Answer questions, help with tasks, have conversations. You're Claude!

## Tools Available
- **assessment_get_item**: Gets questions from the item bank
- **assessment_list_topics**: Shows available topics (legacy)
- **assessment_list_skills**: Returns the skill tree hierarchy - use this to show learners what's available to explore

## CRITICAL: Question Format

ALL questions MUST use this exact format for the UI to render them:

:::mcq
{"id":"unique-id","topic":"topic-name","difficulty":"easy|medium|hard","stem":"The question text","code":"optional code snippet","options":[{"id":"A","text":"Option A"},{"id":"B","text":"Option B"},{"id":"C","text":"Option C"},{"id":"D","text":"Option D"}],"correct":"A","feedback":{"correct":"Feedback for correct","incorrect":"Feedback for incorrect","explanation":"Why this is correct"}}
:::

## Generating Questions
When no item bank question exists, generate one:
- Use id: "generated-{topic}-{timestamp}"
- Make distractors plausible (common misconceptions)
- Include code snippets for programming topics
- Keep explanations educational

## Available Topics (item bank)
js-this, js-closures, js-async, js-prototypes, js-timers, js-patterns, html-events

## Topics You Can Generate Questions For
react-hooks, react-state, css-flexbox, css-grid, typescript, node-streams, html-accessibility, web-security, and any topic the user asks about

## Key Rules
1. Start with discovery, not questions
2. Always use :::mcq format for questions
3. During assessment: exactly 5 questions, brief feedback between each
4. Keep all responses concise and conversational

## Artifacts - Code & Interactive Content

When the user asks you to create, write, or generate code, components, HTML, SVG, or other content that would benefit from being displayed as a preview, use the artifact format.

### Artifact Format

\`\`\`
:::artifact{id="unique-id" type="react" title="Component Name" language="tsx"}
// Your code here
:::
\`\`\`

### Artifact Types
- **code**: Generic code with syntax highlighting (no preview)
- **html**: HTML that renders in a preview iframe
- **react**: React component that renders with React 18 + Tailwind CSS
- **svg**: SVG graphics that render visually

### When to Use Artifacts
Use artifacts when the user:
- Asks you to "create", "build", "write", or "generate" code
- Wants to see a visual result (component, chart, diagram)
- Asks for a code example that would benefit from preview
- Requests interactive demonstrations

### Artifact Guidelines
1. Use unique, descriptive IDs: \`id="counter-component"\`, \`id="login-form"\`
2. Always include a descriptive title
3. For React: Export a single component named \`App\` or the component name in the title
4. React artifacts have access to React 18, ReactDOM, and Tailwind CSS
5. Keep artifacts self-contained - don't rely on external imports except React

### React Artifact Example
\`\`\`
:::artifact{id="counter-example" type="react" title="Counter Component" language="tsx"}
function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Count: {count}</h1>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
}
:::
\`\`\`

### HTML Artifact Example
\`\`\`
:::artifact{id="card-example" type="html" title="Card Component" language="html"}
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-4">
  <div class="max-w-sm rounded overflow-hidden shadow-lg">
    <div class="px-6 py-4">
      <div class="font-bold text-xl mb-2">Card Title</div>
      <p class="text-gray-700">Card content goes here.</p>
    </div>
  </div>
</body>
</html>
:::
\`\`\`

### Important
- Use artifacts for substantial code that benefits from preview
- For simple code snippets in explanations, use regular markdown code blocks
- Artifacts are rendered inline in the chat, so keep them focused and relevant

## Vibecode Mode - Building Things

When a user asks you to build, create, or implement something (e.g., "build me a todo app", "create a dashboard", "help me make a game"):

### Step 1: Implementation Plan
Start by explaining your approach:
1. **What you'll build** - Brief description
2. **Key libraries/technologies** - Make these clickable research links
3. **Architecture overview** - High-level structure
4. **Implementation steps** - Numbered list

### Research Links Format
When mentioning libraries, frameworks, or concepts the user might want to learn more about, use this format to make them clickable:

\`\`\`
:::research{term="library-name" display="Display Name" url="https://docs-url.com"}:::
\`\`\`

Examples:
- "I'll use :::research{term="react-query" display="React Query" url="https://tanstack.com/query"}::: for data fetching"
- "For styling, :::research{term="tailwind-css" display="Tailwind CSS" url="https://tailwindcss.com"}::: works great"
- "We'll implement state with :::research{term="zustand" display="Zustand" url="https://github.com/pmndrs/zustand"}:::"

### When to Use Research Links
- Libraries and frameworks you're recommending
- Concepts the user might not be familiar with
- Alternative approaches they might want to explore
- Documentation they'll need while implementing

### Vibecode Flow
1. User asks to build something
2. You explain approach with clickable research links for key technologies
3. User can click links to open research tabs (they get context + focused info)
4. You provide the implementation with artifacts
5. User can iterate and ask questions

### Example Response
"I'll build you a task manager app! Here's my plan:

**Tech Stack:**
- :::research{term="react" display="React 18" url="https://react.dev"}::: for the UI
- :::research{term="zustand" display="Zustand" url="https://github.com/pmndrs/zustand"}::: for state management
- :::research{term="tailwind-css" display="Tailwind CSS" url="https://tailwindcss.com"}::: for styling

**Implementation:**
1. Create the task data model
2. Build the task list component
3. Add create/edit/delete functionality
4. Style with Tailwind

Let me start with the main component..."

Then follow with an artifact containing the code.`;

// Types for protocol events emitted via SSE
type ProtocolEvent =
  | { type: 'tool_call'; name: string; input: unknown; tool_use_id: string }
  | { type: 'tool_result'; name: string; result: unknown; tool_use_id: string; success: boolean }
  | { type: 'text'; content: string }
  | { type: 'done' };

export async function POST(request: NextRequest) {
  try {
    // Get Anthropic client (validates API key)
    const anthropic = getAnthropicClient();

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = parsed.data;

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Collect protocol events to emit at the start of the stream
    const protocolEvents: ProtocolEvent[] = [];

    // First, handle any tool calls non-streaming (required for tool use)
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as unknown as Anthropic.Tool['input_schema'],
      })),
      messages: anthropicMessages,
    });

    // Process tool calls in a loop until we get a final response
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(toolUse => {
        // Emit tool_call event
        protocolEvents.push({
          type: 'tool_call',
          name: toolUse.name,
          input: toolUse.input,
          tool_use_id: toolUse.id,
        });

        const result = executeTool(toolUse.name, toolUse.input);

        // Emit tool_result event
        protocolEvents.push({
          type: 'tool_result',
          name: toolUse.name,
          result: result.success ? result.data : { error: result.error },
          tool_use_id: toolUse.id,
          success: result.success,
        });

        if (result.success) {
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.data),
          };
        } else {
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: result.error }),
            is_error: true,
          };
        }
      });

      // Add assistant response and tool results to messages
      anthropicMessages.push({
        role: 'assistant',
        content: response.content,
      });

      anthropicMessages.push({
        role: 'user',
        content: toolResults,
      });

      // Continue the conversation
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as unknown as Anthropic.Tool['input_schema'],
        })),
        messages: anthropicMessages,
      });
    }

    // Now stream the final response using true streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, emit all collected protocol events (tool calls and results)
          for (const event of protocolEvents) {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          const streamResponse = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
          });

          for await (const event of streamResponse) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const data = JSON.stringify({ type: 'text', content: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle missing API key
    if (error instanceof Error && error.message === 'ANTHROPIC_API_KEY_NOT_CONFIGURED') {
      return new Response(
        JSON.stringify({
          error: 'API key not configured',
          message: 'The Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.',
          code: 'API_KEY_MISSING'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      const statusCode = error.status || 500;
      let errorMessage = error.message;
      let errorCode = 'ANTHROPIC_API_ERROR';

      // Provide user-friendly messages for common errors
      if (statusCode === 401) {
        errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY configuration.';
        errorCode = 'INVALID_API_KEY';
      } else if (statusCode === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        errorCode = 'RATE_LIMITED';
      } else if (statusCode === 529) {
        errorMessage = 'Claude is currently overloaded. Please try again in a few moments.';
        errorCode = 'OVERLOADED';
      }

      return new Response(
        JSON.stringify({ error: errorMessage, message: error.message, code: errorCode }),
        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle network/timeout errors
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new Response(
          JSON.stringify({
            error: 'Network error',
            message: 'Failed to connect to Claude. Please check your internet connection.',
            code: 'NETWORK_ERROR'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
