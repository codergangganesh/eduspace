# TestSprite Setup

This project is prepared for local TestSprite MCP testing.

## What was added

- A local-only MCP config at `.mcp.json`
- A stable dev script: `npm run dev:testsprite`
- `.mcp.json` is ignored by Git so your API key stays out of commits

## Prerequisites

- Node.js 22 or newer
- A valid TestSprite API key
- An IDE/client that supports MCP

## Project-specific workflow

1. Start the app:

```bash
npm run dev:testsprite
```

The app will run on:

```text
http://127.0.0.1:4173
```

2. Make sure your MCP-capable IDE/client picks up `.mcp.json`.

3. In the IDE chat, ask:

```text
Help me test this project with TestSprite.
```

4. When TestSprite asks for configuration, use:

- Testing type: `Frontend`
- App URL: `http://127.0.0.1:4173`
- Framework/context: `React + Vite`

## Notes for this project

- The app uses Supabase-backed auth and data flows, so seed or test accounts may be needed for deeper journey coverage.
- Public routes like `/` are the safest place to begin smoke coverage.
- Authenticated flows can then cover:
  - student login/register
  - lecturer login/register
  - dashboard routing
  - protected route behavior

## Suggested first prompts

```text
Help me test this Vite React app with TestSprite, starting with public landing, student auth, lecturer auth, and protected-route redirects.
```

```text
Create a smoke test plan for this project and run frontend tests against http://127.0.0.1:4173.
```
