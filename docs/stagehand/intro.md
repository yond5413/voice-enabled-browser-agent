# Introducing Stagehand

> Developers use Stagehand to reliably automate the web.

Stagehand is a browser automation framework used to control web browsers with natural language and code. By combining the power of AI with the precision of code, Stagehand makes web automation flexible, maintainable, and actually reliable.

## The Problem with Browser Automation

Traditional frameworks like Playwright and Puppeteer force you to write brittle scripts that break with every UI change. Web agents promise to solve this with AI, but leave you at the mercy of unpredictable behavior.

**You're stuck between two bad options:**

* **Too brittle**: Traditional selectors break when websites change
* **Too agentic**: AI agents are unpredictable and impossible to debug

## Enter Stagehand

Stagehand gives you the best of both worlds through four powerful primitives that let you choose exactly how much AI to use:

<CardGroup cols={2}>
  <Card title="Act" icon="play" href="/basics/act">
    Execute actions using natural language
  </Card>

  <Card title="Extract" icon="database" href="/basics/extract">
    Pull structured data with schemas
  </Card>

  <Card title="Observe" icon="eye" href="/basics/observe">
    Discover available actions on any page
  </Card>

  <Card title="Agent" icon="robot" href="/basics/agent">
    Automate entire workflows autonomously
  </Card>
</CardGroup>

<CodeGroup>
  ```typescript TypeScript
  // Act - Execute natural language actions
  await page.act("click the login button");

  // Extract - Pull structured data
  const { price } = await page.extract({
    schema: z.object({ price: z.number() })
  });

  // Observe - Discover available actions
  const actions = await page.observe("find submit buttons");

  // Agent - Automate entire workflows
  const agent = stagehand.agent({
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      options: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
  })
  await agent.execute("apply for this job");
  ```

  ```python Python
  # Act - Execute natural language actions
  await page.act("click the login button")

  # Extract - Pull structured data
  result = await page.extract(
    schema={"price": float}
  )

  # Observe - Discover available actions
  actions = await page.observe("find submit buttons")

  # Agent - Automate entire workflows
  await agent.execute("apply for this job")
  ```
</CodeGroup>

## Why Developers Choose Stagehand

* **Precise Control**: Mix AI-powered actions with deterministic code. You decide exactly how much AI to use.

* **Actually Repeatable**: Save and replay actions exactly. No more "it worked on my machine" with browser automations.

* **Maintainable at Scale**: One script can automate multiple websites. When sites change, your automations adapt.

* **Composable Tools**: Choose your level of automation with Act, Extract, Observe, and Agent.

## Built for Modern Development

Stagehand is designed for developers building production browser automations and AI agents that need reliable web access.

<AccordionGroup>
  <Accordion title="Full Playwright Compatibility">
    Use any Playwright API alongside Stagehand. You're never locked into our abstractions.
  </Accordion>

  <Accordion title="TypeScript & Python SDKs">
    First-class support for both ecosystems with type safety and IDE autocomplete.
  </Accordion>

  <Accordion title="Works Everywhere">
    Compatible with all Chromium-based browsers: Chrome, Edge, Arc, Brave, and more.
  </Accordion>

  <Accordion title="Built by Browserbase">
    Created and maintained by the team behind enterprise browser infrastructure.
  </Accordion>
</AccordionGroup>

## Get Started in 60 Seconds

<Info>
  **Pro tip**: For best results, we recommend using Stagehand with [Browserbase](https://www.browserbase.com) for reliable cloud browser infrastructure.
</Info>

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/first-steps/quickstart">
    Build your first automation in under a minute
  </Card>

  <Card title="Try Director" icon="wand-magic-sparkles" href="https://www.director.ai">
    Generate Stagehand scripts with AI
  </Card>

  <Card title="View Examples" icon="code" href="https://github.com/browserbase/stagehand/tree/main/examples">
    See real-world automation examples
  </Card>

  <Card title="Join Discord" icon="discord" href="https://discord.gg/stagehand">
    Get help from the community
  </Card>
</CardGroup>
