# Agent

> Automate complex workflows with AI powered browser agents

## What is `agent()?`

```typescript
agent.execute("apply for a job at browserbase")
```

`agent` turns high level tasks into **fully autonomous** browser workflows. You can customize the agent by specifying the LLM provider and model, setting custom instructions for behavior, and configuring max steps.

<img src="https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=16919711a6cb87516372424d3d852520" alt="Agent" width="800" height="450" data-path="images/agent.gif" srcset="https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=280&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=83f7f053d89ae2651f0782aad78aee11 280w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=560&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=91312dec7c921283494c389ba5cfd272 560w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=840&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=5cc09d74a335b52d37805425caf4aeab 840w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=1100&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=61f24d8a5a087439ad31417c5c889832 1100w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=1650&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=a82933be604d95e48c2af094ec7060a0 1650w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/images/agent.gif?w=2500&fit=max&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=981fa5dfc9ba1822539ff6c4fd114fad 2500w" data-optimize="true" data-opv="2" />

## Why use `agent()`?

<CardGroup cols={2}>
  <Card title="Multi-Step Workflows" icon="route" href="#agent-execution-configuration">
    Execute complex sequences automatically.
  </Card>

  <Card title="Visual Understanding" icon="eye" href="/best-practices/computer-use">
    Sees and understands web interfaces like humans do using computer vision.
  </Card>
</CardGroup>

## Using `agent()`

There are two ways to create agents in Stagehand:

### Computer Use Agents

Use computer use agents with specialized models from OpenAI or Anthropic:

<CodeGroup>
  ```typescript TypeScript
  const agent = stagehand.agent({
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    instructions: "You are a helpful assistant that can use a web browser.",
    options: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  });
  await agent.execute("apply for a job at Browserbase")
  ```

  ```python Python
  agent = stagehand.agent({
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "instructions": "You are a helpful assistant that can use a web browser.",
      "options": {
        "apiKey": os.getenv("ANTHROPIC_API_KEY"),
      },
  })
  await agent.execute("apply for a job at Browserbase")
  ```
</CodeGroup>

### Use Stagehand Agent with Any LLM

Use the agent without specifying a provider to utilize any model or LLM provider:

<Note>Non CUA agents are currently only supported in TypeScript</Note>

```typescript TypeScript
const agent = stagehand.agent();
await agent.execute("apply for a job at Browserbase")
```

## MCP Integrations

Agents can be enhanced with external tools and services through MCP (Model Context Protocol) integrations. This allows your agent to access external APIs and data sources beyond just browser interactions.

<CodeGroup>
  ```typescript TypeScript (Pass URL)
  const agent = stagehand.agent({
    provider: "openai",
    model: "computer-use-preview",
    integrations: [
      `https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`,
    ],
    instructions: `You have access to web search through Exa. Use it to find current information before browsing.`,
    options: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  await agent.execute("Search for the best headphones of 2025 and go through checkout for the top recommendation");
  ```

  ```typescript TypeScript (Create Connection)
  import { connectToMCPServer } from "@browserbasehq/stagehand";

  const supabaseClient = await connectToMCPServer(
    `https://server.smithery.ai/@supabase-community/supabase-mcp/mcp?api_key=${process.env.SMITHERY_API_KEY}`
  );

  const agent = stagehand.agent({
    provider: "openai",
    model: "computer-use-preview",
    integrations: [supabaseClient],
    instructions: `You can interact with Supabase databases. Use these tools to store and retrieve data.`,
    options: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  await agent.execute("Search for restaurants and save the first result to the database");
  ```
</CodeGroup>

<Tip>
  MCP integrations enable agents to be more powerful by combining browser automation with external APIs, databases, and services. The agent can intelligently decide when to use browser actions versus external tools.
</Tip>

<Warning>
  Stagehand uses a 1024x768 viewport by default (the optimal size for Computer Use Agents). Other viewport sizes may reduce performance. If you need to modify the viewport, you can edit in the [Browser Configuration](/configuration/browser).
</Warning>

## Available Models

Use specialized computer use models (e.g., `computer-use-preview` from OpenAI or `claude-sonnet-4-20250514` from Anthropic)

<Card title="Available Models" icon="robot" href="/configuration/models">
  Check out the guide on how to use different models with Stagehand.
</Card>

## Agent Execution Configuration

Control the maximum number of steps the agent can take to complete the task using the `maxSteps` parameter.

<CodeGroup>
  ```typescript TypeScript
  // Set maxSteps to control how many actions the agent can take
  await agent.execute({
    instruction: "Sign me up for a library card",
    maxSteps: 15 // Agent will stop after 15 steps if task isn't complete
  });
  ```

  ```python Python
  # Set max_steps to control how many actions the agent can take
  result = await agent.execute({
      "instruction": "Sign me up for a library card",
      "max_steps": 15  # Agent will stop after 15 steps if task isn't complete
  })
  ```
</CodeGroup>

For complex tasks, increase the `maxSteps` limit and check task success.

<CodeGroup>
  ```typescript TypeScript
  // Complex multi-step task requiring more actions
  const result = await agent.execute({
    instruction: "Find and apply for software engineering jobs, filtering by remote work and saving 3 applications",
    maxSteps: 30, // Higher limit for complex workflows
  });

  // Check if the task completed successfully
  if (result.success === true) {
    console.log("Task completed successfully!");
  } else {
    console.log("Task failed or was incomplete");
  }
  ```

  ```python Python
  # Complex multi-step task requiring more actions
  result = await agent.execute({
      "instruction": "Find and apply for software engineering jobs, filtering by remote work and saving 3 applications",
      "max_steps": 30  # Higher limit for complex workflows
  })

  # Check if the task completed successfully
  if result.success == True:
      print("Task completed successfully!")
  else:
      print("Task failed or was incomplete")
  ```
</CodeGroup>

## Best Practices

Following these best practices will improve your agent's success rate, reduce execution time, and minimize unexpected errors during task completion.

### Start on the Right Page

Navigate to your target page before executing tasks:

<Tabs>
  <Tab title="Do this">
    <CodeGroup>
      ```typescript TypeScript
      await page.goto('https://github.com/browserbase/stagehand');
      await agent.execute('Get me the latest PR on the stagehand repo');
      ```

      ```python Python
      await page.goto("https://github.com/browserbase/stagehand")
      result = await agent.execute("Get me the latest PR on the stagehand repo")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Don't do this">
    <CodeGroup>
      ```typescript TypeScript
      await agent.execute('Go to GitHub and find the latest PR on browserbase/stagehand');
      ```

      ```python Python
      result = await agent.execute("Go to GitHub and find the latest PR on browserbase/stagehand")
      ```
    </CodeGroup>
  </Tab>
</Tabs>

### Be Specific

Provide detailed instructions for better results:

<Tabs>
  <Tab title="Do this">
    <CodeGroup>
      ```typescript TypeScript
      await agent.execute("Find Italian restaurants in Brooklyn that are open after 10pm and have outdoor seating");
      ```

      ```python Python
      result = await agent.execute("Find Italian restaurants in Brooklyn that are open after 10pm and have outdoor seating")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Don't do this">
    <CodeGroup>
      ```typescript TypeScript
      await agent.execute("Find a restaurant");
      ```

      ```python Python
      result = await agent.execute("Find a restaurant")
      ```
    </CodeGroup>
  </Tab>
</Tabs>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Agent is stopping before completing the task">
    **Problem**: Agent stops before finishing the requested task

    **Solutions**:

    * Check if the agent is hitting the maxSteps limit (default is 20)
    * Increase maxSteps for complex tasks: `maxSteps: 30` or higher
    * Break very complex tasks into smaller sequential executions

    ```typescript
    // Increase maxSteps for complex tasks
    await agent.execute({
      instruction: "Complete the multi-page registration form with all required information",
      maxSteps: 40 // Increased limit for complex task
    });

    // Or break into smaller tasks with success checking
    const firstResult = await agent.execute({
      instruction: "Fill out page 1 of the registration form", 
      maxSteps: 15
    });

    // Only proceed if the first task was successful
    if (firstResult.success === true) {
      await agent.execute({
        instruction: "Navigate to page 2 and complete remaining fields",
        maxSteps: 15
      });
    } else {
      console.log("First task failed, stopping execution");
    }
    ```
  </Accordion>

  <Accordion title="Agent is failing to click the proper elements">
    **Problem**: Agent clicks on wrong elements or fails to interact with the correct UI components

    **Solutions**:

    * Ensure proper viewport size: Stagehand uses `1024x768` by default (optimal for Computer Use models)
    * Avoid changing viewport dimensions as other sizes may reduce performance
  </Accordion>
</AccordionGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Act" icon="play" href="/basics/act">
    Execute actions efficiently using observe results
  </Card>

  <Card title="Extract" icon="download" href="/basics/extract">
    Extract structured data from observed elements
  </Card>
</CardGroup>
