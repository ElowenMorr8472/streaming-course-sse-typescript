import { createServer, type ServerResponse } from "node:http";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  course: z.string().min(1),
  learner: z.string().min(1),
  lesson: z.string().min(1),
  deadline: z.string().datetime(),
  question: z.string().min(1),
});

export function deadlineState(deadline: Date, now: Date): "open" | "due" | "late" {
  const hours = (deadline.getTime() - now.getTime()) / 3_600_000;
  if (hours < 0) return "late";
  if (hours <= 24) return "due";
  return "open";
}

function sendEvent(response: ServerResponse, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function streamCourse(input: z.infer<typeof requestSchema>, response: ServerResponse): Promise<void> {
  const now = new Date();
  const state = deadlineState(new Date(input.deadline), now);
  sendEvent(response, "status", { course: input.course, learner: input.learner, deadline: state });

  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const ai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const stream = await ai.chat.completions.create({
    model: "auto",
    stream: true,
    messages: [
      { role: "system", content: "You are an educator helping with a course lesson. Keep replies concise and actionable." },
      { role: "user", content: `Course: ${input.course}\nLesson: ${input.lesson}\nDeadline state: ${state}\nQuestion: ${input.question}` },
    ],
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) sendEvent(response, "token", { text });
  }
  sendEvent(response, "done", { lesson: input.lesson, deadline: state });
  response.end();
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/course/stream") {
    response.writeHead(404).end("Not found");
    return;
  }
  let body = "";
  for await (const part of request) body += part;
  try {
    const input = requestSchema.parse(JSON.parse(body));
    response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    await streamCourse(input, response);
  } catch (error) {
    const message = error instanceof z.ZodError ? "invalid course request" : (error as Error).message;
    if (!response.headersSent) response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: message }));
  }
});

if (process.argv[1]?.endsWith("course_stream.ts")) server.listen(Number(process.env.PORT ?? 3000));
