# AI Rules

> Using AI to write Stagehand code faster, and better.

You're likely using AI to write code, and there's a **right and wrong way to do it.** This page is a collection of rules, configs, and copy‑paste snippets to allow your AI agents/assistants to write performant, Stagehand code as fast as possible.

## Quickstart

<CardGroup cols={2}>
  <Card title="Add MCP servers" icon="screwdriver-wrench">
    Configure Browserbase (Stagehand), Context7, DeepWiki, and Stagehand Docs in your MCP client.
  </Card>

  <Card title="Pin editor rules" icon="memo">
    Drop in `cursorrules` and `claude.md` so AI agents/assistants always emit Stagehand patterns.
  </Card>
</CardGroup>

## Using MCP Servers

MCP (Model Context Protocol) servers act as intermediaries that connect AI systems to external data sources and tools. These servers enable your coding assistant to access real-time information, execute tasks, and retrieve structured data to enhance code generation accuracy.

The following **MCP servers** provide specialized access to Stagehand documentation and related resources:

<Accordion title="Context7 by Upstash" icon="database">
  Provides semantic search across documentation and codebase context. Context7 enables AI assistants to find relevant code patterns, examples, and implementation details from your project history. It maintains contextual understanding of your development workflow and can surface related solutions from previous work.

  **Installation:**

  ```json
  {
    "mcpServers": {
      "context7": {
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp"]
      }
    }
  }
  ```
</Accordion>

<Accordion title="DeepWiki by Cognition" icon="book-open">
  Offers deep indexing of GitHub repositories and documentation. DeepWiki allows AI agents to understand project architecture, API references, and best practices from the entire Stagehand ecosystem. It provides comprehensive knowledge about repository structure, code relationships, and development patterns.

  **Installation:**

  ```json
  {
    "mcpServers": {
      "deepwiki": {
        "url": "https://mcp.deepwiki.com/mcp"
      }
    }
  }
  ```
</Accordion>

<Accordion title="Stagehand Docs by Mintlify" icon="mintbit">
  Direct access to official Stagehand documentation. This MCP server provides AI assistants with up-to-date API references, configuration options, and usage examples for accurate code generation. Mintlify auto-generates this server from the official docs, ensuring your AI assistant always has the latest information.

  **Usage:**

  ```json
  {
    "mcpServers": {
      "stagehand-docs": {
        "url": "https://docs.stagehand.dev/mcp"
      }
    }
  }
  ```
</Accordion>

**How MCP Servers Enhance Your Development:**

* **Real-time Documentation Access**: AI assistants can query the latest Stagehand docs, examples, and best practices
* **Context-Aware Code Generation**: Servers provide relevant code patterns and configurations based on your specific use case
* **Reduced Integration Overhead**: Standardized protocol eliminates the need for custom integrations with each documentation source
* **Enhanced Accuracy**: AI agents receive structured, up-to-date information rather than relying on potentially outdated training data

<Tip>
  **Prompting tip:**
  Explicitly ask your coding agent/assistant to use these MCP servers to fetch relevant information from the docs so they have better context and know how to write proper Stagehand code.

  ie. **"Use the stagehand-docs MCP to fetch the act/observe guidelines, then generate code that follows them. Prefer cached observe results."**
</Tip>

## Editor rule files (copy‑paste)

Drop these in `.cursorrules`, `windsurfrules`, `claude.md`, or any agent rule framework:

<Accordion title="TypeScript">
  ````md
  # Stagehand Project

  This is a project that uses [Stagehand](https://github.com/browserbase/stagehand), which amplifies Playwright with AI-powered `act`, `extract`, and `observe` methods added to the Page class.

  `Stagehand` is a class that provides configuration and browser automation capabilities with:
  - `stagehand.page`: A StagehandPage object (extends Playwright Page)
  - `stagehand.context`: A StagehandContext object (extends Playwright BrowserContext)
  - `stagehand.agent()`: Create AI-powered agents for autonomous multi-step workflows
  - `stagehand.init()`: Initialize the browser session
  - `stagehand.close()`: Clean up resources

  `Page` extends Playwright's Page class with AI-powered methods:
  - `act()`: Perform actions on web elements using natural language
  - `extract()`: Extract structured data from pages using schemas
  - `observe()`: Plan actions and get selectors before executing

  `Agent` provides autonomous Computer Use Agent capabilities:
  - `execute()`: Perform complex multi-step tasks using natural language instructions

  `Context` extends Playwright's BrowserContext class for browser session management.

  Use the following rules to write code for this project.

  - To plan an instruction like "click the sign in button", use Stagehand `observe` to get the action to execute.

  ```typescript
  const results = await page.observe("Click the sign in button");
  ```

  You can also pass in the following params:

  ```typescript
  await page.observe({
    instruction: "the instruction to execute",
    returnAction: true 
  });
  ```

  - The result of `observe` is an array of `ObserveResult` objects that can directly be used as params for `act` like this:
    ```typescript
    const results = await page.observe({
      instruction: "the instruction to execute",
      returnAction: true, // return the action to execute
    });

    await page.act(results[0]);
    ```
    
  - When writing code that needs to extract data from the page, use Stagehand `extract`. Explicitly pass the following params by default:

  ```typescript
  const { someValue } = await page.extract({
    instruction: "the instruction to execute",
    schema: z.object({
      someValue: z.string(),
    }), // The schema to extract
  });
  ```

  ## Initialize

  ```typescript
  import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "BROWSERBASE"
  });

  await stagehand.init();

  const page = stagehand.page; // Playwright Page with act, extract, and observe methods

  const context = stagehand.context; // Playwright BrowserContext
  ```
  ### Configuration Options
  ```typescript
  const StagehandConfig = {
    env: "BROWSERBASE" | "LOCAL", // Environment to run in
    apiKey: process.env.BROWSERBASE_API_KEY, // Browserbase API key
    projectId: process.env.BROWSERBASE_PROJECT_ID, // Browserbase project ID
    debugDom: true, // Enable DOM debugging features
    headless: false, // Run browser in headless mode
    domSettleTimeoutMs: 30_000, // Timeout for DOM to settle
    enableCaching: true, // Enable action caching
    modelName: "gpt-4o", // AI model to use
    modelClientOptions: {
      apiKey: process.env.OPENAI_API_KEY, // OpenAI API key
    },
  };
  ```
  ## Act

  You can act directly with string instructions:

  ```typescript
  await page.act("Click the sign in button");
  ```

  Use variables for dynamic form filling:

  ```typescript
  await page.act({
    action: `Enter the following information:
      Name: %name%
      Email: %email%
      Phone: %phone%`,
    variables: {
      name: "John Doe",
      email: "john@example.com", 
      phone: "+1-555-0123"
    }
  });
  ```

  **Best Practices:**
  - Cache the results of `observe` to avoid unexpected DOM changes
  - Keep actions atomic and specific (e.g., "Click the sign in button" not "Sign in to the website")
  - Use variable substitution for dynamic data entry

  Act `action` should be as atomic and specific as possible, i.e. "Click the sign in button" or "Type 'hello' into the search input".
  AVOID actions that are more than one step, i.e. "Order me pizza" or "Send an email to Paul asking him to call me".

  ## Extract

  ### Simple String Extraction

  ```typescript
  const signInButtonText = await page.extract("extract the sign in button text");
  ```

  ### Structured Extraction with Schema (Recommended)

  Always use Zod schemas for structured data extraction:

  ```typescript
  import { z } from "zod";

  const data = await page.extract({
    instruction: "extract the sign in button text",
    schema: z.object({
      text: z.string(),
    }),
  });
  ```

  ### Array Extraction

  To extract multiple items, wrap the array in a single object:

  ```typescript
  const data = await page.extract({
    instruction: "extract the text inside all buttons",
    schema: z.object({
      buttons: z.array(z.string()),
    })
  });
  ```

  ### Complex Object Extraction

  For more complex data structures:

  ```typescript
  const productData = await page.extract({
    instruction: "extract product information from this page",
    schema: z.object({
      title: z.string(),
      price: z.number(),
      description: z.string(),
      features: z.array(z.string()),
      availability: z.boolean(),
    }),
  });
  ```

  ### Schema Validation

  ```typescript
  import { validateZodSchema } from "./utils.js";
  import { z } from "zod";

  const schema = z.object({ name: z.string() });
  const isValid = validateZodSchema(schema, { name: "John" }); // true
  ```

  ## Agent System

  Stagehand provides an Agent System for autonomous web browsing using Computer Use Agents (CUA). Agents execute multi-step workflows using natural language instructions.

  ### Creating Agents

  ```typescript
  // Basic agent (default)
  const agent = stagehand.agent();

  // OpenAI agent
  const agent = stagehand.agent({
    provider: "openai",
    model: "computer-use-preview",
    instructions: "You are a helpful assistant that can use a web browser.",
    options: { 
      apiKey: process.env.OPENAI_API_KEY 
    }
  });

  // Anthropic agent
  const agent = stagehand.agent({
    provider: "anthropic", 
    model: "claude-sonnet-4-20250514",
    instructions: "You are a helpful assistant that can use a web browser.",
    options: { 
      apiKey: process.env.ANTHROPIC_API_KEY 
    }
  });
  ```
  ### Agent Execution
  ```typescript
  // Simple task
  const result = await agent.execute("Extract the title from this webpage");

  // Complex multi-step task
  const result = await agent.execute({
    instruction: "Apply for the first engineer position with mock data",
    maxSteps: 20,
    autoScreenshot: true
  });
  ```

  ### Best Practices
  - Be specific with instructions: `"Fill out the contact form with name 'John Doe' and submit it"`
  - Break down complex tasks into smaller steps
  - Use error handling with try/catch blocks
  - Combine agents for navigation with traditional methods for precise data extraction

  ```typescript
  // Good: Specific instructions
  await agent.execute("Navigate to products page and filter by 'Electronics'");

  // Avoid: Vague instructions  
  await agent.execute("Do some stuff on this page");
  ```

  ## Project Structure Best Practices

  - Store configurations in `stagehand.config.ts`
  - Use environment variables for API keys (see `.env.example`)
  - Implement main automation logic in functions that accept `{ page, context, stagehand }`
  - Use TypeScript with proper imports from `@browserbasehq/stagehand`
  ````
</Accordion>

<Accordion title="Python">
  ````md
  # Stagehand Python Project

  This is a project that uses [Stagehand Python](https://github.com/browserbase/stagehand-python), which provides AI-powered browser automation with `act`, `extract`, and `observe` methods.

  `Stagehand` is a class that provides configuration and browser automation capabilities with:
  - `stagehand.page`: A StagehandPage object (extends Playwright Page)
  - `stagehand.context`: A StagehandContext object (extends Playwright BrowserContext)
  - `stagehand.agent()`: Create AI-powered agents for autonomous multi-step workflows
  - `stagehand.init()`: Initialize the browser session
  - `stagehand.close()`: Clean up resources

  `Page` extends Playwright's Page class with AI-powered methods:
  - `act()`: Perform actions on web elements using natural language
  - `extract()`: Extract structured data from pages using schemas
  - `observe()`: Plan actions and get selectors before executing

  `Agent` provides autonomous Computer Use Agent capabilities:
  - `execute()`: Perform complex multi-step tasks using natural language instructions

  Use the following rules to write code for this project.

  - To plan an instruction like "click the sign in button", use Stagehand `observe` to get the action to execute.

  ```python
  results = await page.observe("Click the sign in button")
  ```

  You can also pass in the following params:

  ```python
  await page.observe(
      instruction="the instruction to execute",
      draw_overlay=True  # Show visual overlay on observed elements
  )
  ```

  - The result of `observe` is a list of `ObserveResult` objects that can directly be used as params for `act` like this:
    ```python
    results = await page.observe("Click the sign in button")
    await page.act(results[0])
    ```
  - When writing code that needs to extract data from the page, use Stagehand `extract`. Use Pydantic models for schemas:

  ```python
  from pydantic import BaseModel

  class ExtractedData(BaseModel):
      some_value: str

  result = await page.extract(
      instruction="the instruction to execute",
      schema=ExtractedData
  )
  ```

  ## Initialize

  ```python
  from stagehand import Stagehand, StagehandConfig
  import asyncio
  import os
  from dotenv import load_dotenv

  load_dotenv()

  async def main():
      config = StagehandConfig(
          env="BROWSERBASE",  # or "LOCAL"
          api_key=os.getenv("BROWSERBASE_API_KEY"),
          project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
          model_name="google/gemini-2.5-flash-preview-05-20",
          model_api_key=os.getenv("MODEL_API_KEY"),
      )
      
      # Recommended: Use as async context manager
      async with Stagehand(config) as stagehand:
          page = stagehand.page
          # Your automation code here
          
      # Alternative: Manual initialization
      stagehand = Stagehand(config)
      await stagehand.init()
      page = stagehand.page
      # Your automation code here
      await stagehand.close()

  if __name__ == "__main__":
      asyncio.run(main())
  ```

  ### Configuration Options

  Key configuration options in `StagehandConfig`:

  ```python
  config = StagehandConfig(
      env="BROWSERBASE",  # or "LOCAL"
      api_key=os.getenv("BROWSERBASE_API_KEY"),
      project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
      model_name="google/gemini-2.5-flash-preview-05-20",
      model_api_key=os.getenv("MODEL_API_KEY"),
      verbose=1,  # 0=minimal, 1=medium, 2=detailed
      dom_settle_timeout_ms=30000,
      self_heal=True,  # Enable self-healing functionality
  )
  ```

  ## Act

  You can act directly with string instructions:

  ```python
  await page.act("Click the sign in button")
  ```

  Use variables for dynamic form filling:

  ```python
  await page.act(
      "Enter the following information: Name: John Doe, Email: john@example.com"
  )
  ```

  **Best Practices:**
  - Cache the results of `observe` to avoid unexpected DOM changes
  - Keep actions atomic and specific (e.g., "Click the sign in button" not "Sign in to the website")
  - Use specific, descriptive instructions

  Act `action` should be as atomic and specific as possible, i.e. "Click the sign in button" or "Type 'hello' into the search input".
  AVOID actions that are more than one step, i.e. "Order me pizza" or "Send an email to Paul asking him to call me".

  ## Extract

  ### Simple String Extraction
  ```python
  sign_in_button_text = await page.extract("extract the sign in button text")
  ```

  ### Structured Extraction with Schema (Recommended)
  Always use Pydantic models for structured data extraction:

  ```python
  from pydantic import BaseModel, Field
  from typing import List

  class ButtonData(BaseModel):
      text: str = Field(..., description="Button text content")

  data = await page.extract(
      instruction="extract the sign in button text",
      schema=ButtonData
  )
  ```

  ### Array Extraction
  For arrays, use List types:

  ```python
  from pydantic import BaseModel, Field
  from typing import List

  class ButtonsData(BaseModel):
      buttons: List[str] = Field(..., description="List of button texts")

  data = await page.extract(
      instruction="extract the text inside all buttons",
      schema=ButtonsData
  )
  ```

  ### Complex Object Extraction
  For more complex data structures:

  ```python
  from pydantic import BaseModel, Field
  from typing import List

  class Company(BaseModel):
      name: str = Field(..., description="Company name")
      description: str = Field(..., description="Brief company description")

  class Companies(BaseModel):
      companies: List[Company] = Field(..., description="List of companies")

  companies_data = await page.extract(
      "Extract names and descriptions of 5 companies",
      schema=Companies
  )
  ```

  ## Agent System

  Stagehand provides an Agent System for autonomous web browsing using Computer Use Agents (CUA).

  ### Creating Agents

  ```python
  # Basic agent (uses default model)
  agent = stagehand.agent()

  # OpenAI agent
  agent = stagehand.agent(
      model="computer-use-preview",
      instructions="You are a helpful web navigation assistant.",
      options={"apiKey": os.getenv("OPENAI_API_KEY")}
  )

  # Anthropic agent
  agent = stagehand.agent(
      model="claude-sonnet-4-20250514",
      instructions="You are a helpful web navigation assistant.",
      options={"apiKey": os.getenv("ANTHROPIC_API_KEY")}
  )
  ```

  ### Agent Execution

  ```python
  # Simple task
  result = await agent.execute("Play a game of 2048")

  # Complex multi-step task with options
  result = await agent.execute(
      instruction="Apply for the first engineer position with mock data",
      max_steps=20,
      auto_screenshot=True,
      wait_between_actions=1000  # milliseconds
  )
  ```

  **Best Practices:**
  - Be specific with instructions: `"Fill out the contact form with name 'John Doe' and submit it"`
  - Break down complex tasks into smaller steps
  - Use error handling with try/except blocks
  - Combine agents for navigation with traditional methods for precise data extraction

  ```python
  # Good: Specific instructions
  await agent.execute("Navigate to products page and filter by 'Electronics'")

  # Avoid: Vague instructions
  await agent.execute("Do some stuff on this page")
  ```

  ## Project Structure Best Practices

  - Store configurations in environment variables or config files
  - Use async/await patterns consistently
  - Implement main automation logic in async functions
  - Use async context managers for resource management
  - Use type hints and Pydantic models for data validation
  - Handle exceptions appropriately with try/except blocks
  ````
</Accordion>

## Security notes

* Do not embed secrets in docs or rule files; use env vars in MCP configs.
* Avoid broad actions that may trigger unintended navigation; prefer `observe` first.

## Resources/references

* Context7 MCP (Upstash)
  * [https://github.com/upstash/context7](https://github.com/upstash/context7)
* DeepWiki MCP
  * [https://mcp.deepwiki.com/](https://mcp.deepwiki.com/)
* Stagehand Docs MCP (Mintlify)
  * [https://docs.stagehand.dev/mcp](https://docs.stagehand.dev/mcp)
