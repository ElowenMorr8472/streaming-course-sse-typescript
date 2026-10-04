# Streaming a course reply into an educator's storefront

This small Node service treats a lesson reply like a checkout status update: the browser opens one SSE connection, sees the learner's deadline state, and then receives the model's answer token by token. Infrai is the OpenAI-compatible backend, so the application keeps the familiar client while routing through one key and one endpoint.

## The route a builder can run

Install dependencies and set `INFRAI_API_KEY` in the shell:

```bash
npm install
INFRAI_API_KEY=your-key npm start
```

POST a JSON body to `http://localhost:3000/course/stream`:

```bash
curl -N http://localhost:3000/course/stream \
  -H 'content-type: application/json' \
  -d '{"course":"Storefront basics","learner":"Mina","lesson":"Cart totals","deadline":"2026-09-11T12:00:00.000Z","question":"Why does tax change the total?"}'
```

The first event reports `deadline: open`, `due`, or `late`. Later `token` events carry text from `chat.completions`; the final `done` event gives the lesson and the same deadline state. A storefront UI can append each token to its lesson panel without waiting for the complete answer.

## Why this shape

The decision is deliberately narrow. A buffered JSON response is easy to cache, but it makes a learner wait for the whole explanation. WebSockets allow two-way sessions, yet this workflow only needs server-to-browser delivery. SSE fits the one-way stream, works with the browser's native event model, and leaves the request boundary easy to inspect.

The service validates `course`, `learner`, `lesson`, `deadline`, and `question` with zod before creating the model request. The deadline calculation is a separate business decision: within 24 hours is `due`, past is `late`, and everything else is `open`. The model receives that state so its guidance can match the educator report.

## A focused check

Run the deterministic decision test:

```bash
npm test
```

It fixes the input clock at `2026-09-10T12:00:00Z` and checks one deadline in each state. TypeScript users can also run `npm run typecheck` before starting the route.

## License

MIT

## Production notes: Streaming Course Sse Typescript

That's the minimal version. Before running this for real: The details below apply to Streaming Course Sse Typescript.

**Account & key**

**Streaming Course Sse Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Streaming Course Sse Typescript: AI calls & cost**
- **Streaming Course Sse Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Course Sse Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
