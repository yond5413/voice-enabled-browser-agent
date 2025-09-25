# Installation

> Integrate Stagehand into an existing project.

Install Stagehand in your current app with the TypeScript or Python SDK.

<Tip>
  For TypeScript/Node.js: We highly recommend using the Node.js runtime environment to run Stagehand scripts, as opposed to newer alternatives like Deno or Bun.

  **Bun does not support Stagehand** since it doesn't support [Playwright](https://github.com/search?q=repo:oven-sh/bun+playwright\&type=issues).

  For Python: We require Python 3.9+ and recommend using [uv](https://docs.astral.sh/uv/) to manage your virtual environment.
</Tip>

<Tabs>
  <Tab title="TypeScript">
    ### Install dependencies

    <CodeGroup>
      ```bash npm
      npm install @browserbasehq/stagehand playwright zod
      ```

      ```bash pnpm
      pnpm add @browserbasehq/stagehand playwright zod
      ```

      ```bash yarn
      yarn add @browserbasehq/stagehand playwright zod
      ```
    </CodeGroup>

    <Tip>
      If you plan to run locally, install browsers once: `npx playwright install`.
      For cloud browser sessions, skip this.
    </Tip>

    ### Configure environment

    Set environment variables (or a `.env` via your framework):

    <CodeGroup>
      ```bash Bash
      OPENAI_API_KEY=your_api_key
      BROWSERBASE_API_KEY=your_api_key
      BROWSERBASE_PROJECT_ID=your_project_id
      ```
    </CodeGroup>

    ### Use in your codebase

    Add Stagehand where you need browser automation.

    <CodeGroup>
      ```typescript TypeScript
      import "dotenv/config";
      import { Stagehand } from "@browserbasehq/stagehand";
      import { z } from "zod";

      async function main() {
        const stagehand = new Stagehand({
          env: "BROWSERBASE"
        });

        await stagehand.init();
        const page = stagehand.page;

        await page.goto("https://example.com");
        
        // Act on the page
        await page.act("Click the sign in button");
        
        // Extract structured data
        const { title } = await page.extract({
          instruction: "extract the page title",
          schema: z.object({
            title: z.string(),
          }),
        });

        console.log(title);
        await stagehand.close();
      }

      main().catch((err) => {
        console.error(err);
        process.exit(1);
      });
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    <Tip>
      For uv installation instructions see the [uv installation guide](https://docs.astral.sh/uv/getting-started/installation/#__tabbed_1_1).
    </Tip>

    ### Initialize virtual environment

    <CodeGroup>
      ```bash uv
      uv init my-stagehand-project
      cd my-stagehand-project
      ```

      ```bash pip
      python -m venv venv
      source venv/bin/activate  # On Windows: venv\Scripts\activate
      ```
    </CodeGroup>

    ### Add dependencies

    <CodeGroup>
      ```bash uv
      uv add stagehand
      ```

      ```bash pip
      pip install stagehand
      ```
    </CodeGroup>

    ### Configure environment

    Set environment variables (or a `.env` via your framework):

    <CodeGroup>
      ```bash Bash
      MODEL_API_KEY=your_api_key
      BROWSERBASE_API_KEY=your_api_key
      BROWSERBASE_PROJECT_ID=your_project_id
      ```
    </CodeGroup>

    ### Use in your codebase

    <CodeGroup>
      ```python Python
      import os
      import asyncio
      from stagehand import Stagehand
      from pydantic import BaseModel

      class PageData(BaseModel):
          title: str

      async def main():
          stagehand = Stagehand(
              env="BROWSERBASE",
              model_api_key=os.getenv("MODEL_API_KEY")
          )
          await stagehand.init()
          page = stagehand.page
          
          await page.goto("https://example.com")
          
          # Act on the page
          await page.act("Click the sign in button")
          
          # Extract structured data
          result = await page.extract(
              instruction = "extract the page title",
              schema = PageData
          )
          
          print(result.title)
          await stagehand.close()

      if __name__ == "__main__":
          asyncio.run(main())
      ```
    </CodeGroup>
  </Tab>
</Tabs>

## Next steps

<CardGroup cols={2}>
  <Card title="Configuration" icon="gear" href="/configuration/browser">
    Environment, Browserbase vs Local, logging, timeouts, LLM customization
  </Card>

  <Card title="Act" icon="arrow-pointer" href="/basics/act">
    Perform precise actions with natural language
  </Card>

  <Card title="Extract" icon="download" href="/basics/extract">
    Typed data extraction with Zod schemas
  </Card>

  <Card title="Observe" icon="eye" href="/basics/observe">
    Discover elements and suggested actions
  </Card>
</CardGroup>
