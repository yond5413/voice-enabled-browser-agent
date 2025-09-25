# Act

> Interact with a web page

## What is `act()`?

```typescript
page.act("click on add to cart")
```

`act` enables Stagehand to perform **individual** actions on a web page. Use it to build self-healing and deterministic automations that adapt to website changes.

## Why use `act()`?

<CardGroup cols={2}>
  <Card title="Natural Language Instructions" icon="wand-magic-sparkles" href="#using-act">
    Write automation in plain English. No selectors or complex syntax.
  </Card>

  <Card title="Precise Control" icon="crosshairs" href="#best-practices">
    Build automations step by step. Define exactly what happens at every moment.
  </Card>

  <Card title="Self-Healing" icon="bandage" href="#ensure-reliable-actions">
    Actions automatically adapt when websites change.
  </Card>

  <Card title="Caching" icon="repeat" href="#reduce-model-costs">
    Cache actions to avoid LLM calls and ensure consistent execution across runs.
  </Card>
</CardGroup>

## Using `act()`

Use `act` to perform single actions in your automation. Here's how to click a button:

<CodeGroup>
  ```typescript TypeScript
  await page.goto("https://example-store.com");
  await page.act("click the add to cart button");
  ```

  ```python Python
  await page.goto("https://example-store.com")
  await page.act("click the add to cart button")
  ```
</CodeGroup>

With `act`, breaking complex actions into small, single-step actions works best. If you need to orchestrate multi-step flows, use multiple `act` commands or `agent`.

<Accordion title="Suggested actions">
  | Action               | Example instruction                |
  | -------------------- | ---------------------------------- |
  | Click                | `click the button`                 |
  | Fill                 | `fill the field with <value>`      |
  | Type                 | `type <text> into the search box`  |
  | Press                | `press <key> in the search field`  |
  | Scroll               | `scroll to <position>`             |
  | Select from dropdown | `select <value> from the dropdown` |
</Accordion>

<Tabs>
  <Tab title="Do this">
    Break your task into single-step actions.

    <CodeGroup>
      ```typescript TypeScript
      // Break it into single-step actions
      await page.act("open the filters panel");
      await page.act("choose 4-star rating");
      await page.act("click the apply button");
      ```

      ```python Python
      # Break it into single-step actions
      await page.act("open the filters panel")
      await page.act("choose 4-star rating")
      await page.act("click the apply button")
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Don't do this">
    For multi-step tasks, use [`agent()`](/basics/agent) instead.

    <CodeGroup>
      ```typescript TypeScript
      // Too complex - trying to do multiple things at once
      await page.act("open the filters panel, choose 4-star rating, and click apply");
      ```

      ```python Python
      # Too complex - trying to do multiple things at once
      await page.act("open the filters panel, choose 4-star rating, and click apply")
      ```
    </CodeGroup>
  </Tab>
</Tabs>

### Advanced Configuration

For advanced scenarios, you can configure additional options:

<CodeGroup>
  ```typescript TypeScript
  // Dynamic food search with advanced options
  const foodItem = "organic quinoa";

  await page.act({
    action: "Type %foodItem% in the search box and press enter",
    variables: {
      foodItem: foodItem
    },
    modelName: "google/gemini-2.5-pro",
    modelClientOptions: {
      modelApiKey: process.env.GOOGLE_API_KEY,
    },
    iframes: true, // Search within iframes if needed
    domSettleTimeoutMs: 45000, // Wait longer for dynamic content
    timeoutMs: 60000 // Extended timeout for slow-loading forms
  });
  ```

  ```python Python
  # Dynamic food search with advanced options
  food_item = "organic quinoa"

  await page.act({
    "action": "Type %foodItem% in the search box and press enter",
    "variables": {
      "foodItem": food_item
    },
    "modelName": "google/gemini-2.5-pro",
    "modelClientOptions": {
      "modelApiKey": os.environ.get("GOOGLE_API_KEY")
    },
    "iframes": True, # Search within iframes if needed
    "domSettleTimeoutMs": 45000, # Wait longer for dynamic content
    "timeoutMs": 60000 # Extended timeout for slow-loading forms
  })
  ```
</CodeGroup>

<Note>
  Shadow DOM support is now available! Set `experimental: true` in your Stagehand configuration to enable it. See the [configuration guide](/configuration/browser) for more details.
</Note>

## Best practices

### Ensure reliable actions

Use `observe()` to discover candidate actions on the current page and plan reliably. It returns a list of suggested actions (with selector, description, method, and arguments). You can pass an observed action directly to `act` to execute it.

<CodeGroup>
  ```typescript TypeScript
  const [action] = await page.observe("click the login button");

  if (action) {
    await page.act(action);
  }
  ```

  ```python Python
  results = await page.observe("click the login button")

  if results:
      await page.act(results[0])
  ```
</CodeGroup>

<Card title="Analyze pages with observe()" icon="magnifying-glass" iconType="sharp-solid" href="/basics/observe">
  Plan actions with `observe()` before executing with `act`.
</Card>

### Reduce model costs

Cache observed actions to avoid repeated LLM calls and ensure consistent execution.

<CodeGroup>
  ```typescript TypeScript
  // Cost-optimized actions with caching
  const actionCache = new Map();

  const getCachedAction = async (instruction: string) => {
    if (actionCache.has(instruction)) {
      return actionCache.get(instruction);
    }
    
    const [action] = await page.observe(instruction);
    actionCache.set(instruction, action);
    return action;
  };

  // Reuse cached actions
  const loginAction = await getCachedAction("click the login button");
  await page.act(loginAction);
  ```

  ```python Python
  # Cost-optimized actions with caching
  action_cache = {}

  async def get_cached_action(instruction: str):
      if instruction in action_cache:
          return action_cache[instruction]
      
      results = await page.observe(instruction)
      if results:
          action = results[0]
          action_cache[instruction] = action
          return action
      
      return None

  # Reuse cached actions
  login_action = await get_cached_action("click the login button")
  if login_action:
      await page.act(login_action)
  ```
</CodeGroup>

<Card title="Complete caching guide" icon="database" iconType="sharp-solid" href="/best-practices/caching">
  Learn advanced caching techniques and patterns for optimal performance.
</Card>

### Secure your automations

Variables will not be shared with LLM providers. Use them for passwords, API keys, and other sensitive data.

<Note>
  Load sensitive data from environment variables using `.env` files. Never hardcode API keys, passwords, or other secrets directly in your code.
</Note>

<CodeGroup>
  ```typescript TypeScript
  await page.act({
    action: "enter %username% in the email field",
    variables: {
      username: "user@example.com"
    }
  });

  await page.act({
    action: "enter %password% in the password field",
    variables: {
      password: process.env.USER_PASSWORD
    }
  });
  ```

  ```python Python
  # If using Python, set `use_api: true` in your Stagehand configuration

  await page.act(
    "enter %username% in the email field",
    variables={
        "username": "user@example.com"
    }
  )

  await page.act(
    "enter %password% in the password field",
    variables={
        "password": os.environ.get("USER_PASSWORD")
    }
  )
  ```
</CodeGroup>

<Warning>
  When handling sensitive data, set `verbose: 0` in your Stagehand configuration to prevent secrets from appearing in logs. See the [configuration guide](/configuration/browser) for more details.
</Warning>

<Card title="User Data Best Practices" icon="shield-check" iconType="sharp-solid" href="/best-practices/user-data">
  Complete guide to securing your browser automations with best practices and configurations.
</Card>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Method not supported">
    **Problem**: `act` fails with "method not supported" error

    **Solutions**:

    * Use clear and detailed instructions for what you want to accomplish
    * Review our [evals](https://stagehand.dev/evals) to find the best models for your use case
    * Use [`observe()`](/basics/observe) and verify the resulting action is within a list of expected actions

    **Solution 1: Validate with observe**

    <CodeGroup>
      ```typescript TypeScript
      const prompt = "click the submit button";
      const expectedMethod = "click";

      try {
        await page.act(prompt);
      } catch (error) {
        if (error.message.includes("method not supported")) {
          // Observe the same prompt to get the planned action
          const [action] = await page.observe(prompt);
          
          if (action && action.method === expectedMethod) {
            await page.act(action);
          } else {
            throw new Error(`Unsupported method: expected "${expectedMethod}", got "${action?.method}"`);
          }
        } else {
          throw error;
        }
      }
      ```

      ```python Python
      prompt = "click the submit button"
      expected_method = "click"

      try:
          await page.act(prompt)
      except Exception as error:
          if "method not supported" in str(error):
              # Observe the same prompt to get the planned action
              results = await page.observe(prompt)
              
              if results and results[0].method == expected_method:
                  await page.act(results[0])
              else:
                  method = results[0].method if results else "unknown"
                  raise Exception(f'Unsupported method: expected "{expected_method}", got "{method}"')
          else:
              raise error
      ```
    </CodeGroup>

    **Solution 2: Retry with exponential backoff**

    <CodeGroup>
      ```typescript TypeScript
      // Retry with exponential backoff for intermittent issues
      const prompt = "click the submit button";
      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await page.act(prompt, { timeoutMs: 10000 + (attempt * 5000) });
          break; // Success, exit retry loop
        } catch (error) {
          if (error.message.includes("method not supported") && attempt < maxRetries) {
            // Exponential backoff: wait 2^attempt seconds
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
      ```

      ```python Python
      # Retry with exponential backoff for intermittent issues
      import asyncio

      prompt = "click the submit button"
      max_retries = 3

      for attempt in range(max_retries + 1):
          try:
              timeout = 10000 + (attempt * 5000)
              await page.act(prompt, {"timeoutMs": timeout})
              break  # Success, exit retry loop
          except Exception as error:
              if "method not supported" in str(error) and attempt < max_retries:
                  # Exponential backoff: wait 2^attempt seconds
                  delay = 2 ** attempt
                  print(f"Retry {attempt + 1}/{max_retries} after {delay}s")
                  await asyncio.sleep(delay)
              else:
                  raise error
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Action failed or timed out">
    **Problem**: `act` times out or fails to complete action (often due to element not found)

    **Solutions**:

    * Ensure page has fully loaded
    * Check if content is in iframes: [Learn more about working with iframes](/best-practices/working-with-iframes)
    * Increase action timeout
    * Use `observe()` first to verify element exists

    <CodeGroup>
      ```typescript TypeScript
      // Handle timeout and element not found issues
      try {
        await page.act("click the submit button", { timeout: 30000 });
      } catch (error) {
        // Check if page is fully loaded
        await page.waitForLoadState('domcontentloaded');
        
        // Use observe to check element state
        const [element] = await page.observe("find the submit button");
        
        if (element) {
          console.log("Element found, trying more specific instruction");
          await page.act("click the submit button at the bottom of the form");
        } else {
          console.log("Element not found, trying alternative selector");
          await page.act("click the button with text 'Submit'");
        }
      }
      ```

      ```python Python
      # Handle timeout and element not found issues
      try:
          await page.act("click the submit button", {"timeout": 30000})
      except Exception as error:
          # Check if page is fully loaded
          await page.wait_for_load_state('domcontentloaded')
          
          # Use observe to check element state
          results = await page.observe("find the submit button")
          
          if results:
              print("Element found, trying more specific instruction")
              await page.act("click the submit button at the bottom of the form")
          else:
              print("Element not found, trying alternative selector")
              await page.act("click the button with text 'Submit'")
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Incorrect element selected">
    **Problem**: `act` performs action on wrong element

    **Solutions**:

    * Be more specific in instructions: include visual cues, position, or context
    * Use `observe()` to preview which element will be selected
    * Add contextual information: "the search button in the header"
    * Use unique identifiers when available

    <CodeGroup>
      ```typescript TypeScript
      // More precise element targeting
      // Instead of:
      await page.act("click the button");

      // Use specific context:
      await page.act("click the red 'Delete' button next to the user John Smith");

      // Or preview with observe first:
      const [action] = await page.observe("click the submit button in the checkout form");
      if (action.description.includes("checkout")) {
        await page.act(action);
      }
      ```

      ```python Python
      # More precise element targeting
      # Instead of:
      await page.act("click the button")

      # Use specific context:
      await page.act("click the red 'Delete' button next to the user John Smith")

      # Or preview with observe first:
      results = await page.observe("click the submit button in the checkout form")
      if results and "checkout" in results[0].description:
          await page.act(results[0])
      ```
    </CodeGroup>
  </Accordion>
</AccordionGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Orchestrate complex workflows with Agent" icon="robot" iconType="sharp-solid" href="/basics/agent">
    Use `Agent` to autonomously execute multi-step tasks and complex workflows.
  </Card>

  <Card title="Caching actions" icon="bolt" iconType="sharp-solid" href="/best-practices/caching">
    Speed up repeated automations by caching actions.
  </Card>

  <Card title="Extract data with extract()" icon="table" iconType="sharp-solid" href="/basics/extract">
    Use `extract` with a data schema to pull clean, typed data from any page.
  </Card>

  <Card title="Working with iframes" icon="frame" iconType="sharp-solid" href="/best-practices/working-with-iframes">
    Learn best practices for interacting with elements inside iframes.
  </Card>
</CardGroup>
