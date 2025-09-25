# Logging & Debugging

> Set up logging, debugging, and error tracking for Stagehand workflows

Stagehand provides comprehensive logging capabilities to help you debug automation workflows, track execution, and diagnose issues. Configure logging levels, structured output, and debugging tools for both development and production environments.

## Logging Configuration

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "BROWSERBASE", // or "LOCAL"
    verbose: 1, // 0 = errors only, 1 = info, 2 = debug
  });
  ```

  ```python Python
  from stagehand import Stagehand

  stagehand = Stagehand(
      env="BROWSERBASE",  # or "LOCAL"
      verbose=1,  # 0 = errors only, 1 = info, 2 = debug
  )
  ```
</CodeGroup>

### Verbose Levels

* **Level 0**: Errors only - minimal output for production
* **Level 1**: Info - includes successful operations and important events
* **Level 2**: Debug - comprehensive logging including internal operations

## Structured Logging

### Log Line Format

Each log entry contains structured information:

<CodeGroup>
  ```typescript TypeScript
  interface LogLine {
    category: 'browser' | 'action' | 'llm' | 'error' | 'stagehand' | 'cache';
    message: string;
    level: 0 | 1 | 2; // error | info | debug
    timestamp: string;
    auxiliary?: {
      executionTime?: { value: string; unit: string };
      sessionId?: string;
      url?: string;
      [key: string]: any;
    };
  }
  ```

  ```python Python
  # Log line structure in Python
  {
    "category": "browser" | "action" | "llm" | "error" | "stagehand" | "cache",
    "message": str,
    "level": 0 | 1 | 2,  # error | info | debug
    "timestamp": str,
    "auxiliary": {
      "execution_time": {"value": str, "unit": str},
      "session_id": str,
      "url": str,
      # ... other context data
    }
  }
  ```
</CodeGroup>

### Custom Logger

<CodeGroup>
  ```typescript TypeScript
  class AdvancedLogger {
    private logFile?: string;
    
    constructor(logFile?: string) {
      this.logFile = logFile;
    }
    
    log = (logLine: any) => {
      const timestamp = new Date().toISOString();
      const colors = {
        browser: '\x1b[34m', // blue
        action: '\x1b[32m',  // green
        llm: '\x1b[35m',     // magenta
        error: '\x1b[31m',   // red
        stagehand: '\x1b[36m', // cyan
        cache: '\x1b[33m',   // yellow
      };
      
      const color = colors[logLine.category] || '\x1b[0m';
      const reset = '\x1b[0m';
      
      // Console output with colors
      console.log(`${color}[${logLine.category}]${reset} ${logLine.message}`);
      
      // Log execution time if available
      if (logLine.auxiliary?.executionTime) {
        console.log(` ${logLine.auxiliary.executionTime.value}${logLine.auxiliary.executionTime.unit}`);
      }
      
      // Log additional context
      if (logLine.auxiliary && Object.keys(logLine.auxiliary).length > 0) {
        console.log('  Context:', JSON.stringify(logLine.auxiliary, null, 2));
      }
      
      // File logging (optional)
      if (this.logFile) {
        const logEntry = {
          timestamp,
          ...logLine
        };
        require('fs').appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
      }
    }
  }

  // Usage
  const logger = new AdvancedLogger('./automation.log');
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    verbose: 2,
    logger: logger.log
  });
  ```

  ```python Python
  import json
  import os
  from datetime import datetime
  from typing import Dict, Any, Optional

  class AdvancedLogger:
      def __init__(self, log_file: Optional[str] = None):
          self.log_file = log_file
      
      def log(self, log_line: Dict[str, Any]):
          timestamp = datetime.now().isoformat()
          colors = {
              'browser': '\033[34m',   # blue
              'action': '\033[32m',    # green
              'llm': '\033[35m',       # magenta
              'error': '\033[31m',     # red
              'stagehand': '\033[36m', # cyan
              'cache': '\033[33m',     # yellow
          }
          
          color = colors.get(log_line.get('category', ''), '\033[0m')
          reset = '\033[0m'
          
          # Console output with colors
          print(f"{color}[{log_line.get('category')}]{reset} {log_line.get('message')}")
          
          # Log execution time if available
          if log_line.get('auxiliary', {}).get('execution_time'):
              exec_time = log_line['auxiliary']['execution_time']
              print(f"{exec_time['value']}{exec_time['unit']}")
          
          # Log additional context
          auxiliary = log_line.get('auxiliary', {})
          if auxiliary and len(auxiliary) > 0:
              print('  Context:', json.dumps(auxiliary, indent=2))
          
          # File logging (optional)
          if self.log_file:
              log_entry = {
                  'timestamp': timestamp,
                  **log_line
              }
              with open(self.log_file, 'a') as f:
                  f.write(json.dumps(log_entry) + '\n')

  # Usage
  logger = AdvancedLogger('./automation.log')
  stagehand = Stagehand(
      env="BROWSERBASE",
      verbose=2,
      logger=logger.log
  )
  ```
</CodeGroup>

## Detailed Logging Features

### LLM Inference Logging

Enable detailed logging of all LLM interactions:

<CodeGroup>
  ```typescript TypeScript
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    logInferenceToFile: true,  // Creates inference_summary/ directory
    verbose: 2
  });
  ```

  ```python Python
  stagehand = Stagehand(
      env="BROWSERBASE",
      log_inference_to_file=True,  # Creates inference_summary/ directory
      verbose=2
  )
  ```
</CodeGroup>

The `inference_summary/` directory structure:

```
inference_summary/                   
├── act_summary/            
│   ├── 20240329_080446068.json    
│   ├── 20240329_080447019.json   
│   └── act_summary.json          
├── extract_summary/               
│   ├── 20240329_081205123.json    
│   └── extract_summary.json       
└── observe_summary/                
    ├── 20240329_081634891.json    
    └── observe_summary.json       
```

## Log Analysis & Debugging

### Common Log Patterns

<Tabs>
  <Tab title="Successful Action">
    ```json
    {
      "category": "action", 
      "message": "act completed successfully",
      "level": 1,
      "auxiliary": {
        "executionTime": {"value": "1250", "unit": "ms"},
        "url": "https://example.com",
        "sessionId": "session-123"
      }
    }
    ```
  </Tab>

  <Tab title="LLM Inference">
    ```json
    {
      "category": "llm",
      "message": "inference completed", 
      "level": 1,
      "auxiliary": {
        "model": "gpt-4o",
        "tokens": {"prompt": 3451, "completion": 45},
        "executionTime": {"value": "951", "unit": "ms"}
      }
    }
    ```
  </Tab>

  <Tab title="Error Example">
    ```json
    {
      "category": "action",
      "message": "action failed: element not found",
      "level": 0, 
      "auxiliary": {
        "selector": "button[data-testid='submit']",
        "url": "https://example.com/form",
        "sessionId": "session-123"
      }
    }
    ```
  </Tab>
</Tabs>

## Best Practices

<AccordionGroup>
  <Accordion title="Development Environment">
    * Use `verbose: 2` with visual debugging
    * Enable browser DevTools for element inspection
    * Use `logInferenceToFile: true` to capture LLM decisions
    * Implement structured logging early
  </Accordion>

  <Accordion title="Production Environment">
    * Use `verbose: 1` to balance visibility with performance
    * Implement error tracking and alerting
    * Use structured JSON logging
    * Monitor session success rates and execution times
  </Accordion>

  <Accordion title="Security & Compliance">
    * Never log credentials or sensitive data
    * Implement log retention policies
    * Secure log files and dashboards
  </Accordion>
</AccordionGroup>
