# URL Shortener

A REST API that shortens URLs and redirects visitors to the original link. Built with Node.js, Express, TypeScript, and SQLite.

## Requirements

- Node.js 22+
- npm

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Server starts at `http://localhost:3002`. Set the `PORT` environment variable to use a different port.

## Test

```bash
npm test
```

Tests run against an in-memory SQLite database — no setup needed.

## API

### `POST /shorten`

Shortens a URL. Returns an existing code if the URL was already shortened.

**Request body**

| Field         | Type   | Required | Description                                      |
|---------------|--------|----------|--------------------------------------------------|
| `url`         | string | Yes      | The URL to shorten (must be http or https)       |
| `customalias` | string | No       | Custom alias (3–20 chars, `A-Z a-z 0-9 - _` only) |

**Example — auto-generated code**

```bash
curl -X POST http://localhost:3002/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some/long/path"}'
```

```json
{ "code": "aB3x9Kpq", "url": "https://example.com/some/long/path" }
```

**Example — custom alias**

```bash
curl -X POST http://localhost:3002/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customalias": "my-link"}'
```

```json
{ "code": "my-link", "url": "https://example.com" }
```

**Responses**

| Status | Meaning                                      |
|--------|----------------------------------------------|
| 201    | Created — new short code                     |
| 200    | URL already shortened — returns existing code |
| 400    | Missing or invalid URL, or invalid alias format |
| 409    | Custom alias already taken                   |
| 500    | Internal server error                        |

---

### `GET /:code`

Redirects to the original URL.

```bash
curl -L http://localhost:3002/my-link
```

| Status | Meaning               |
|--------|-----------------------|
| 301    | Redirect to original URL |
| 404    | Code not found        |

## Design decisions

**Duplicate URLs** — if the same URL is submitted again without a custom alias, the existing code is returned (200) rather than creating a duplicate. If a custom alias is provided for an already-shortened URL, a second mapping is created so both codes work.

**Short code generation** — uses [nanoid](https://github.com/ai/nanoid) with a 64-character URL-safe alphabet and 8-character length. That gives 64⁸ ≈ 281 trillion possible codes. Collisions are checked in a loop before insert; in practice the loop never runs more than once at any realistic scale.

**Persistence** — SQLite via `better-sqlite3`. The `code` column is the primary key, so the database enforces uniqueness at the storage layer as a second line of defence.

## Project structure

```
src/
├── index.ts        # Entry point — starts the server
├── app.ts          # Express app factory (used by tests)
├── db/
│   └── index.ts    # SQLite connection and schema init
└── utils/
    └── shortid.ts  # nanoid-based short code generator
tests/
└── app.test.ts     # Vitest + supertest integration tests
```
