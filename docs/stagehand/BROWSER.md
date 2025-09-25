# Browser

> Configure Stagehand on Browserbase or locally

Stagehand supports two primary environments:

* **Browserbase** - Cloud-managed browser infrastructure optimized for production web automation at scale
* **Local** - Run browsers directly on your machine for development and debugging

## Browserbase Environment

Browserbase provides managed cloud browser infrastructure optimized for web automation at scale. It offers advanced features like stealth mode, proxy support, and persistent contexts.

<Card icon="cloud" title="Browserbase" href="https://docs.browserbase.com" description="Explore the features and benefits of using Browserbase for scalable web automation.">
  Discover the power of cloud-managed browser infrastructure with Browserbase.
</Card>

### Environment Variables

Before getting started, set up the required environment variables:

<CodeGroup>
  ```bash .env
  BROWSERBASE_API_KEY=your_api_key_here
  BROWSERBASE_PROJECT_ID=your_project_id_here
  ```
</CodeGroup>

<Tip>
  Get your API key and Project ID from the [Browserbase Dashboard](https://browserbase.com/overview)
</Tip>

### Using Stagehand with Browserbase

#### Basic Setup

The simplest way to get started is with default settings:

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
  });

  await stagehand.init();
  ```

  ```python Python
  import os
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="BROWSERBASE",
  )

  await stagehand.init()
  ```
</CodeGroup>

#### Advanced Configuration

Configure browser settings, proxy support, and other session parameters:

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    // Optional: API Key and Project ID will be pulled directly from your environment
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    browserbaseSessionCreateParams: {
      proxies: true,
      region: "us-west-2",
      browserSettings: {
        viewport: { width: 1920, height: 1080 },
        blockAds: true,
      },
    },
  });

  await stagehand.init();
  console.log("Session ID:", stagehand.sessionId);
  ```

  ```python Python
  import os
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="BROWSERBASE",
      # Optional: API Key and Project ID will be pulled directly from your environment
      api_key=os.getenv("BROWSERBASE_API_KEY"),
      project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
      browserbase_session_create_params={
          "proxies": True,
          "region": "us-west-2",
          "browser_settings": {
              "viewport": {"width": 1920, "height": 1080},
              "block_ads": True,
          },
      },
  )
  ```
</CodeGroup>

<Accordion title="Advanced Browserbase Configuration Example">
  <CodeGroup>
    ```typescript TypeScript
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      browserbaseSessionCreateParams: {
        projectId: process.env.BROWSERBASE_PROJECT_ID!, // Optional: automatically set if given in environment variable or by Stagehand parameter
        proxies: true,
        region: "us-west-2",
        timeout: 3600, // 1 hour session timeout
        keepAlive: true, // Available on Startup plan
        browserSettings: {
          advancedStealth: false, // this is a Scale Plan feature - reach out to support@browserbase.com to enable
          blockAds: true,
          solveCaptchas: true,
          recordSession: false,
          os: "windows", // Valid: "windows" | "mac" | "linux" | "mobile" | "tablet"
          viewport: {
            width: 1920,
            height: 1080,
          },
        },
        userMetadata: {
          userId: "automation-user-123",
          environment: "production",
        },
      },
    });
    ```

    ```python Python
    stagehand = Stagehand(
        env="BROWSERBASE",
        api_key=os.getenv("BROWSERBASE_API_KEY"),
        project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
        browserbase_session_create_params={
            "project_id": os.getenv("BROWSERBASE_PROJECT_ID"), # Optional: automatically set if given in environment or by Stagehand parameter
            "proxies": True,
            "region": "us-west-2",
            "timeout": 3600,  # 1 hour session timeout
            "keep_alive": True,  # Available on Startup plan
            "browser_settings": {
                "advanced_stealth": False,  # this is a Scale Plan feature - reach out to support@browserbase.com to enable
                "block_ads": True,
                "solve_captchas": True,
                "record_session": False,
                "os": "windows",  # "windows" | "mac" | "linux" | "mobile" | "tablet"
                "viewport": {
                    "width": 1920,
                    "height": 1080,
                },
            },
            "user_metadata": {
                "user_id": "automation-user-123",
                "environment": "production",
            },
        },
    )
    ```
  </CodeGroup>
</Accordion>

#### Initialization Result

After calling `stagehand.init()`, the method returns configuration information about the initialized session:

<CodeGroup>
  ```typescript TypeScript
  const result = await stagehand.init();
  console.log(result);
  ```

  ```python Python
  result = await stagehand.init()
  print(result)
  ```
</CodeGroup>

The returned object contains:

```Example
{
  debugUrl: 'https://www.browserbase.com/devtools/inspector.html?wss=connect.browserbase.com/debug/f8a21b4a-6fa1-4ab9-9007-fbfe61dc14f0/devtools/page/5474B0E0510C5B6E629BEB06E799CD70?debug=true',
  sessionUrl: 'https://www.browserbase.com/sessions/f8a21b4a-6fa1-4ab9-9007-fbfe61dc14f0',
  sessionId: 'f8a21b4a-6fa1-4ab9-9007-fbfe61dc14f0'
}
```

<AccordionGroup>
  <Accordion title="debugUrl">
    **Open the Browserbase [session live view](https://docs.browserbase.com/features/session-live-view)** to include a human-in-the-loop.
  </Accordion>

  <Accordion title="sessionUrl">
    **Open the [session replay](https://docs.browserbase.com/features/session-replay)** to see the full session recording.
  </Accordion>

  <Accordion title="sessionId">
    **Unique identifier** for the [Browserbase session](https://docs.browserbase.com/introduction/what-is-browserbase). This is used to identify the session in the Browserbase dashboard and to connect to the session.
  </Accordion>
</AccordionGroup>

### Alternative: Browserbase SDK

If you prefer to manage sessions directly, you can use the Browserbase SDK:

<CodeGroup>
  ```typescript TypeScript
  import { Browserbase } from "@browserbasehq/sdk";

  const bb = new Browserbase({ 
    apiKey: process.env.BROWSERBASE_API_KEY! 
  });

  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    // Add configuration options here
  });
  ```

  ```python Python
  from browserbase import Browserbase

  bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])

  session = bb.sessions.create(
      project_id=os.environ["BROWSERBASE_PROJECT_ID"],
      # Add configuration options here
  )
  ```
</CodeGroup>

#### Connecting to an Existing Session

Connect to a previously created Browserbase session using its session ID:

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    browserbaseSessionID: "existing-session-uuid-here",
  });

  await stagehand.init();
  console.log("Resumed Session ID:", stagehand.sessionId);
  ```

  ```python Python
  import os
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="BROWSERBASE",
      browserbase_session_id="existing-session-uuid-here",
  )

  await stagehand.init()
  print(f"Resumed Session ID: {stagehand.session_id}")
  ```
</CodeGroup>

## Local Environment

The local environment runs browsers directly on your machine, providing full control over browser instances and configurations. Ideal for development, debugging, and scenarios requiring custom browser setups.

### Environment Comparison

| Feature                     | Browserbase                   | Local                         |
| --------------------------- | ----------------------------- | ----------------------------- |
| **Scalability**             | High (cloud-managed)          | Limited (local resources)     |
| **Stealth Features**        | Advanced fingerprinting       | Basic stealth                 |
| **Proxy Support**           | Built-in residential proxies  | Manual configuration          |
| **Session Persistence**     | Cloud context storage         | File-based user data          |
| **Geographic Distribution** | Multi-region deployment       | Single machine                |
| **Debugging**               | Session recordings & logs     | Direct DevTools access        |
| **Setup Complexity**        | Environment variables only    | Browser installation required |
| **Cost**                    | Usage-based pricing           | Infrastructure & maintenance  |
| **Best For**                | Production, scale, compliance | Development, debugging        |

### Basic Local Setup

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "LOCAL"
  });
    
  await stagehand.init();
  console.log("Session ID:", stagehand.sessionId);
  ```

  ```python Python
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="LOCAL"
  )

  await stagehand.init()
  print(f"Session ID: {stagehand.session_id}")
  ```
</CodeGroup>

### Advanced Local Configuration

Customize browser launch options for local development:

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "LOCAL",
    localBrowserLaunchOptions: {
      headless: false, // Show browser window
      devtools: true, // Open developer tools
      viewport: { width: 1280, height: 720 },
      executablePath: '/opt/google/chrome/chrome', // Custom Chrome path
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
      env: {
        NODE_ENV: "development",
        DEBUG: "true",
      },
    },
  });

  await stagehand.init();
  ```

  ```python Python
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="LOCAL",
      headless=False,  # Show browser window
      local_browser_launch_options={
          "devtools": True,  # Open developer tools
          "viewport": {"width": 1280, "height": 720},
          "executable_path": "/opt/google/chrome/chrome",  # Custom Chrome path
          "args": [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-web-security",
              "--allow-running-insecure-content",
          ],
          "env": {
              "NODE_ENV": "development",
              "DEBUG": "true",
          },
      },
  )

  await stagehand.init()
  ```
</CodeGroup>

### Connecting to your local browser

Connect to your existing local Chrome/Chromium browser instead of launching a new one. This lets you automate your normal browser with all your existing tabs, extensions and settings.

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
  	env: "LOCAL",
  	localBrowserLaunchOptions: {
  		cdpUrl: 'http://localhost:9222'
  	}
  });

  await stagehand.init();
  ```

  ```python Python
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="LOCAL",
      local_browser_launch_options={
        cdp_url="http://localhost:9222"
      }
  )

  await stagehand.init()
  ```
</CodeGroup>

## Troubleshooting

### Common Issues

<AccordionGroup>
  <Accordion title="Browserbase Authentication Errors">
    * Verify your `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set correctly
    * Check that your API key has the necessary permissions
    * Ensure your Browserbase account has sufficient credits
  </Accordion>

  <Accordion title="Local Browser Launch Failures">
    * Install Chrome or Chromium on your system
    * Set the correct `executablePath` for your Chrome installation
    * Check that required dependencies are installed (Linux: `libnss3-dev libatk-bridge2.0-dev libgtk-3-dev libxss1 libasound2`)
  </Accordion>

  <Accordion title="Session Timeout Issues">
    * Increase session timeout in `browserbaseSessionCreateParams.timeout`
    * Use `keepAlive: true` for long-running sessions
    * Monitor session usage to avoid unexpected terminations
  </Accordion>
</AccordionGroup>
