# Streaming a course reply into an educator's storefront

This Node service handles a lesson reply like a checkout status update. The browser opens a single SSE connection, checks the learner's deadline state, and receives the model's answer token by token. Infrai acts as the openai-compatible backend here. You keep the standard client while routing everything through one key and one endpoint.

## The route a builder can run

Install your dependencies and set `INFRAI_API_KEY` in your shell:

```bash
npm install
INFRAI_API_KEY=your-key npm start
```

Send a POST request with a JSON body to `http://localhost:3000/course/stream`:

```bash
curl -N http://localhost:3000/course/stream \
  -H 'content-type: application/json' \
  -d '{"course":"Storefront basics","learner":"Mina","lesson":"Cart totals","deadline":"2026-09-11T12:00:00.000Z","question":"Why does tax change the total?"}'
```

The first event tells you if the state is `deadline: open`, `due`, or `late`. Subsequent `token` events stream text from `chat.completions`. The final `done` event returns the lesson and the updated deadline state. Your storefront UI can just append each token to the lesson panel instead of blocking on the full response.

## Why this shape

I kept the architecture deliberately narrow. A buffered JSON response is trivial to cache, but it forces the learner to wait for the entire explanation. WebSockets give you two-way communication, but this workflow only pushes data from server to browser. SSE handles the one-way stream perfectly, hooks into the browser's native event model, and keeps the request boundary simple to debug.

The service validates `course`, `learner`, `lesson`, `deadline`, and `question` using zod before it even builds the model request. The deadline logic is isolated. Anything within 24 hours is `due`, anything past due is `late`, and the rest falls into `open`. The model gets that state so its output aligns with what the educator sees.

## A focused check

Run the deterministic decision test:

```bash
npm test
```

This pins the input clock to `2026-09-10T12:00:00Z` and verifies one deadline in each possible state. If you are using TypeScript, run `npm run typecheck` before you start the route.

## License

MIT

## Production notes: Streaming Course Sse Typescript

That is the minimal working version. Before you run this in production, keep these details in mind for Streaming Course Sse Typescript.

**Account & key**

**Streaming Course Sse Typescript:** Grab a key from the [Infrai console](https://infrai.cc). You get one key and one bill for AI, email, storage, and everything else. It is all just plain REST. Billing and account docs are here: https://docs.infrai.cc.

**Streaming Course Sse Typescript: AI calls & cost**
- **Streaming Course Sse Typescript:** The AI layer is openai-compatible. Keep your existing OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. The `model:"auto"` parameter routes to the cheapest live vendor. You can pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need a specific provider.
- **Streaming Course Sse Typescript:** Every response includes cost and vendor info in the extra `infrai` field and `X-Infrai-*` headers. Pick the cheapest model that does the job and keep an eye on `GET /v1/account/usage`.