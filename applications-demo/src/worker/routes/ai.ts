import { Hono } from 'hono';
import { AICompletion, AIError, AIChatMessage } from '@/types';

const app = new Hono();

// AI Code Completion
app.post('/completion', async (c) => {
  try {
    const body = await c.req.json();
    const { code, language, position, context } = body;

    if (!code || !language) {
      return c.json({ error: 'Code and language are required' }, 400);
    }

    const prompt = `You are an expert ${language} developer. Complete the following code at the specified position. Only return the completion text, no explanations.

Code:
${code}

Position: ${position}
Context: ${context || 'No additional context'}

Complete the code:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer. Provide only code completions, no explanations.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const completion = data.choices[0]?.message?.content?.trim();

    if (!completion) {
      return c.json({ error: 'No completion generated' }, 400);
    }

    return c.json({
      success: true,
      data: {
        text: completion,
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        confidence: 0.8,
      } as AICompletion,
    });
  } catch (error) {
    console.error('Error generating completion:', error);
    return c.json({ error: 'Failed to generate completion' }, 500);
  }
});

// AI Error Detection
app.post('/errors', async (c) => {
  try {
    const body = await c.req.json();
    const { code, language } = body;

    if (!code || !language) {
      return c.json({ error: 'Code and language are required' }, 400);
    }

    const prompt = `Analyze the following ${language} code for errors, bugs, and potential improvements. Return a JSON array of errors with the following structure:
{
  "message": "Error description",
  "line": line_number,
  "column": column_number,
  "severity": "error|warning|info",
  "suggestion": "How to fix it"
}

Code:
${code}

Analysis:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer and code reviewer. Analyze code for errors and provide specific, actionable feedback.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content?.trim();

    if (!analysis) {
      return c.json({ error: 'No analysis generated' }, 400);
    }

    // Try to parse the JSON response
    let errors: AIError[] = [];
    try {
      errors = JSON.parse(analysis);
    } catch (parseError) {
      // If JSON parsing fails, try to extract errors from text
      const lines = analysis.split('\n');
      let currentLine = 1;
      
      for (const line of lines) {
        if (line.includes('error') || line.includes('warning') || line.includes('bug')) {
          errors.push({
            message: line,
            line: currentLine,
            column: 1,
            severity: 'warning',
            suggestion: 'Review this line for potential issues',
          });
        }
        currentLine++;
      }
    }

    return c.json({
      success: true,
      data: errors,
    });
  } catch (error) {
    console.error('Error analyzing code:', error);
    return c.json({ error: 'Failed to analyze code' }, 500);
  }
});

// AI Chat Assistant
app.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, code, language, chatHistory } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const systemPrompt = `You are an expert programming assistant. You help developers with code questions, debugging, and best practices. Be concise, helpful, and provide practical solutions.`;

    const userPrompt = `Language: ${language || 'Not specified'}
Code Context: ${code || 'No code provided'}

User Question: ${message}

Previous Chat:
${chatHistory?.map((msg: AIChatMessage) => `${msg.role}: ${msg.content}`).join('\n') || 'No previous messages'}

Please provide a helpful response:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content?.trim();

    if (!assistantMessage) {
      return c.json({ error: 'No response generated' }, 400);
    }

    const chatMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
    };

    return c.json({
      success: true,
      data: chatMessage,
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return c.json({ error: 'Failed to process chat message' }, 500);
  }
});

// AI Code Explanation
app.post('/explain', async (c) => {
  try {
    const body = await c.req.json();
    const { code, language } = body;

    if (!code || !language) {
      return c.json({ error: 'Code and language are required' }, 400);
    }

    const prompt = `Explain the following ${language} code in simple terms. Focus on what the code does, how it works, and any important concepts. Keep it concise but comprehensive.

Code:
${code}

Explanation:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert programming educator. Explain code in clear, simple terms that both beginners and experienced developers can understand.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content?.trim();

    if (!explanation) {
      return c.json({ error: 'No explanation generated' }, 400);
    }

    return c.json({
      success: true,
      data: {
        explanation,
        code,
        language,
      },
    });
  } catch (error) {
    console.error('Error explaining code:', error);
    return c.json({ error: 'Failed to explain code' }, 500);
  }
});

// AI Performance Optimization
app.post('/optimize', async (c) => {
  try {
    const body = await c.req.json();
    const { code, language, performanceMetrics } = body;

    if (!code || !language) {
      return c.json({ error: 'Code and language are required' }, 400);
    }

    const prompt = `Analyze the following ${language} code for performance optimization opportunities. Consider:
1. Time complexity
2. Space complexity
3. Memory usage
4. Algorithm efficiency
5. Best practices

Current Performance Metrics: ${performanceMetrics || 'Not provided'}

Code:
${code}

Provide specific optimization suggestions with code examples:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert in performance optimization and software engineering. Provide specific, actionable optimization suggestions with code examples.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const optimization = data.choices[0]?.message?.content?.trim();

    if (!optimization) {
      return c.json({ error: 'No optimization suggestions generated' }, 400);
    }

    return c.json({
      success: true,
      data: {
        suggestions: optimization,
        originalCode: code,
        language,
      },
    });
  } catch (error) {
    console.error('Error optimizing code:', error);
    return c.json({ error: 'Failed to optimize code' }, 500);
  }
});

export const aiRoutes = app;
export default app; 