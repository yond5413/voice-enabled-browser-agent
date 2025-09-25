# Quickstart

> Stagehand allows you to build web automations with natural language and code.

If this is your **first time using Stagehand**, you should try [Director](https://director.ai) first. It's an agent that allows you to build Stagehand workflows using natural language. You can also try Stagehand using our [MCP server](/integrations/mcp/introduction) .

Otherwise, the quickest way to start with Stagehand is with our CLI. It scaffolds a ready‑to‑run Stagehand app with sensible defaults, and an example script.

<Note>
  This quickstart is for **TypeScript**. For **Python**, see the [installation guide](/first-steps/installation).
</Note>

## 1) Create a sample project

<CodeGroup>
  ```bash Bash
  npx create-browser-app
  ```
</CodeGroup>

## 2) Run it

Follow the CLI prompts to enter the project directory and add your API keys. Then run the example script.

<CodeGroup>
  ```bash Bash
  cd my-stagehand-app # Enter the project directory
  cp .env.example .env  # Add your API keys
  npm start # Run the example script
  ```
</CodeGroup>

## 3) Use Stagehand (act, extract, observe)

The scaffold includes an index.ts file that contains the example script. Here's what it looks like:

<CodeGroup>
  ```typescript TypeScript
  import "dotenv/config";
  import { Stagehand } from "@browserbasehq/stagehand";

  async function main() {
    const stagehand = new Stagehand({
      env: "BROWSERBASE"
    });

    await stagehand.init();

    console.log(`Stagehand Session Started`);
    console.log(`Watch live: https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`);

    const page = stagehand.page;

    await page.goto("https://stagehand.dev");

    const extractResult = await page.extract("Extract the value proposition from the page.");
    console.log(`Extract result:\n`, extractResult);

    const actResult = await page.act("Click the 'Evals' button.");
    console.log(`Act result:\n`, actResult);

    const observeResult = await page.observe("What can I click on this page?");
    console.log(`Observe result:\n`, observeResult);

    const agent = await stagehand.agent({
      instructions: "You're a helpful assistant that can control a web browser.",
    });

    const agentResult = await agent.execute("What is the most accurate model to use in Stagehand?");
    console.log(`Agent result:\n`, agentResult);

    await stagehand.close();
  }

  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });

  ```
</CodeGroup>

<Tip>
  To use, set provider keys in `.env` (e.g., `OPENAI_API_KEY`). For cloud browsers, add `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`.
</Tip>

## Next steps

Learn about the Stagehand primitives: act, extract, observe, and agent.

<CardGroup cols={2}>
  <Card title="Act" icon="arrow-pointer" href="/basics/act">
    Perform actions on web pages with natural language
  </Card>

  <Card title="Extract" icon="download" href="/basics/extract">
    Get structured data with Zod schemas
  </Card>

  <Card title="Observe" icon="eye" href="/basics/observe">
    Discover available elements and actions
  </Card>

  <Card title="Agent" icon="robot" href="/basics/agent">
    Autonomous multi-step browser workflows
  </Card>
</CardGroup>
