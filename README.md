# llm-tool-call

Example how to use tool call with OpenAI and Anthropic.

## Install Dependency

This project is created using `bun` you can install the package using npm or bun package manager.

Install package using npm.

```bash
npm run install
```

Install package using bun.

```bash
bun install
```

## Run the project

The example project is using firecrawl, so please grab your Firecrawl apikey [here](https://firecrawl.dev).

Copy example env variable.

```bash
cp .env.example .env
```

Please update the value:
```bash
OPENAI_API_KEY=sk-...
FIRE_CRAWL_API_KEY=fc-...
ANTHROPIC_API_KEY=sk-...
```

Then run the script using javascript.

Run openai example.
```bash
node run index.js
```

Run anthropic example.
```bash
node run anthropic.js
```

