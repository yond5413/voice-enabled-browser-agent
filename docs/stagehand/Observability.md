# Observability

> Track Stagehand automation with session visibility and analytics

Stagehand provides powerful observability features to help you monitor, track performance, and analyze your browser automation workflows. Focus on session monitoring, resource usage, and operational insights for both Browserbase and local environments.

## Browserbase Session Monitoring

When running on Browserbase, you gain access to comprehensive cloud-based monitoring and session management through the Browserbase API and dashboard.

<div style={{ textAlign: "center" }}>
  <img src="https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=979e1a3ea1cb2159548373ecdbbdec50" alt="Browserbase Session Observability" width="400" width="1112" height="720" data-path="media/observability.gif" srcset="https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=280&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=1c30871851e84db43ad04df6b5ee425b 280w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=560&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=1ab1840ab4f2893c8295612eb2bfd955 560w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=840&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=5a932366568e6ffa973be53ae9ca303a 840w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=1100&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=0a013acc7851769d065e9d33ffe7e9dc 1100w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=1650&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=59ceb7f15bc38993adc15fdfb2e17bf5 1650w, https://mintcdn.com/stagehand/W3kYIUy5sYF-nkqt/media/observability.gif?w=2500&maxW=1112&auto=format&n=W3kYIUy5sYF-nkqt&q=85&s=d67489f355e5d6e71f3612c2aa6489f4 2500w" data-optimize="true" data-opv="2" />
</div>

### Live Session Visibility

Browserbase provides real-time visibility into your automation sessions:

**Session Dashboard Features**

* Real-time browser screen recording and replay
* Network request monitoring with detailed timing
* JavaScript console logs and error tracking
* CPU and memory usage metrics
* Session status and duration tracking

**Session Management & API Access**

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";
  import { Browserbase } from "@browserbasehq/sdk";

  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  const stagehand = new Stagehand({
    env: "BROWSERBASE"
  });

  await stagehand.init();

  const sessionInfo = await browserbase.sessions.retrieve(stagehand.sessionId);

  console.log("Session status:", sessionInfo.status);
  console.log("Session region:", sessionInfo.region);
  console.log("CPU usage:", sessionInfo.avgCpuUsage);
  console.log("Memory usage:", sessionInfo.memoryUsage);
  console.log("Proxy bytes:", sessionInfo.proxyBytes);
  ```

  ```python Python
  import os
  from stagehand import Stagehand
  from browserbase import Browserbase

  browserbase = Browserbase(
    api_key=os.getenv("BROWSERBASE_API_KEY"),
  )

  stagehand = Stagehand(
      env="BROWSERBASE",
  )

  await stagehand.init()

  session_info = browserbase.sessions.retrieve(stagehand.session_id)

  print(f"Session status: {session_info['status']}")
  print(f"Session region: {session_info['region']}")
  print(f"CPU usage: {session_info['avgCpuUsage']}")
  print(f"Memory usage: {session_info['memoryUsage']}")
  print(f"Proxy bytes: {session_info['proxyBytes']}")
  ```
</CodeGroup>

### Session Analytics & Insights

<CardGroup>
  <Card title="Real-Time Monitoring" icon="chart-line">
    Monitor live session status, resource usage, and geographic distribution. Scale and manage concurrent sessions with real-time insights.
  </Card>

  <Card title="Session Recordings" icon="video">
    Review complete session recordings with frame-by-frame playback. Analyze network requests and debug browser interactions visually.
  </Card>

  <Card title="API Management" icon="code">
    Programmatically access session data, automate lifecycle management, and integrate with monitoring systems through our API.
  </Card>

  <Card title="Usage Monitoring" icon="chart-bar">
    Track resource consumption, session duration, and API usage. Get detailed breakdowns of costs and utilization across your automation.
  </Card>
</CardGroup>

### Session Monitoring & Filtering

Query and monitor sessions by status and metadata:

<CodeGroup>
  ```typescript TypeScript
  import { Browserbase } from "@browserbasehq/sdk";

  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  // List sessions with filtering
  async function getFilteredSessions() {
    const sessions = await browserbase.sessions.list({
      status: 'RUNNING'
    });
    
    return sessions.map(session => ({
      id: session.id,
      status: session.status, // RUNNING, COMPLETED, ERROR, TIMED_OUT
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      region: session.region,
      avgCpuUsage: session.avgCpuUsage,
      memoryUsage: session.memoryUsage,
      proxyBytes: session.proxyBytes,
      userMetadata: session.userMetadata
    }));
  }

  // Query sessions by metadata
  async function querySessionsByMetadata(query: string) {
    const sessions = await browserbase.sessions.list({
      q: query
    });
    
    return sessions;
  }
  ```

  ```python Python
  import os
  from browserbase import Browserbase

  browserbase = Browserbase(
      api_key=os.getenv("BROWSERBASE_API_KEY"),
  )

  def get_filtered_sessions():
      sessions = browserbase.sessions.list(status="RUNNING")
      
      return [{
          'id': session['id'],
          'status': session['status'],  # RUNNING, COMPLETED, ERROR, TIMED_OUT
          'started_at': session['startedAt'],
          'ended_at': session['endedAt'],
          'region': session['region'],
          'avg_cpu_usage': session['avgCpuUsage'],
          'memory_usage': session['memoryUsage'],
          'proxy_bytes': session['proxyBytes'],
          'user_metadata': session['userMetadata']
      } for session in sessions]

  def query_sessions_by_metadata(query):
      sessions = browserbase.sessions.list(q=query)
      
      return sessions
  ```
</CodeGroup>

## Local Environment Monitoring

For local development, Stagehand provides performance monitoring and resource tracking capabilities directly on your machine.

### Performance Tracking

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";

  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1, // Monitor performance without debug noise
  });

  // Track local automation metrics
  const startTime = Date.now();
  const initialMetrics = stagehand.metrics;

  // ... perform automation tasks

  const finalMetrics = stagehand.metrics;
  const executionTime = Date.now() - startTime;

  console.log('Local Performance Summary:', {
    executionTime: `${executionTime}ms`,
    totalTokens: finalMetrics.totalPromptTokens + finalMetrics.totalCompletionTokens,
    averageResponseTime: finalMetrics.totalInferenceTimeMs / 3, // Assuming 3 operations
    tokensPerSecond: (finalMetrics.totalPromptTokens + finalMetrics.totalCompletionTokens) / (executionTime / 1000)
  });
  ```

  ```python Python
  from stagehand import Stagehand
  import time

  stagehand = Stagehand(
      env="LOCAL",
      verbose=1,  # Monitor performance without debug noise
  )

  # Track local automation metrics
  start_time = time.time()
  initial_metrics = stagehand.metrics

  # ... perform automation tasks

  final_metrics = stagehand.metrics
  execution_time = (time.time() - start_time) * 1000  # Convert to ms

  print('Local Performance Summary:', {
      'execution_time': f"{execution_time:.0f}ms",
      'total_tokens': final_metrics['total_prompt_tokens'] + final_metrics['total_completion_tokens'],
      'average_response_time': final_metrics['total_inference_time_ms'] / 3,  # Assuming 3 operations
      'tokens_per_second': (final_metrics['total_prompt_tokens'] + final_metrics['total_completion_tokens']) / (execution_time / 1000)
  })
  ```
</CodeGroup>

## Resource Usage Monitoring

When running locally, monitor system resource usage and browser performance:

<CodeGroup>
  ```typescript TypeScript
  import { Stagehand } from "@browserbasehq/stagehand";
  import * as os from 'os';
  import { performance } from 'perf_hooks';

  class LocalResourceMonitor {
    private cpuUsage: number[] = [];
    private memoryUsage: number[] = [];
    
    startMonitoring() {
      const interval = setInterval(() => {
        // Track system resources
        const memUsage = process.memoryUsage();
        this.memoryUsage.push(memUsage.heapUsed / 1024 / 1024); // MB
        
        // Track CPU (simplified)
        const loadAvg = os.loadavg()[0];
        this.cpuUsage.push(loadAvg);
      }, 1000);
      
      return interval;
    }
    
    getResourceSummary() {
      return {
        avgMemoryUsage: this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length,
        peakMemoryUsage: Math.max(...this.memoryUsage),
        avgCpuLoad: this.cpuUsage.reduce((a, b) => a + b, 0) / this.cpuUsage.length,
        totalDataPoints: this.cpuUsage.length
      };
    }
  }

  const monitor = new LocalResourceMonitor();
  const interval = monitor.startMonitoring();

  const stagehand = new Stagehand({ env: "LOCAL" });

  // ... run automation

  clearInterval(interval);
  console.log('Resource Usage:', monitor.getResourceSummary());
  ```

  ```python Python
  import psutil
  import time
  from typing import List
  from stagehand import Stagehand

  class LocalResourceMonitor:
      def __init__(self):
          self.cpu_usage: List[float] = []
          self.memory_usage: List[float] = []
          self.monitoring = False
      
      def start_monitoring(self):
          self.monitoring = True
          import threading
          
          def monitor_resources():
              while self.monitoring:
                  # Track CPU and memory usage
                  cpu_percent = psutil.cpu_percent(interval=1)
                  memory_info = psutil.virtual_memory()
                  
                  self.cpu_usage.append(cpu_percent)
                  self.memory_usage.append(memory_info.percent)
                  
                  time.sleep(1)
          
          thread = threading.Thread(target=monitor_resources)
          thread.daemon = True
          thread.start()
          return thread
      
      def stop_monitoring(self):
          self.monitoring = False
      
      def get_resource_summary(self):
          if not self.cpu_usage or not self.memory_usage:
              return {'error': 'No monitoring data collected'}
          
          return {
              'avg_cpu_usage': sum(self.cpu_usage) / len(self.cpu_usage),
              'peak_cpu_usage': max(self.cpu_usage),
              'avg_memory_usage': sum(self.memory_usage) / len(self.memory_usage),
              'peak_memory_usage': max(self.memory_usage),
              'total_data_points': len(self.cpu_usage)
          }

  monitor = LocalResourceMonitor()
  monitor.start_monitoring()

  stagehand = Stagehand(env="LOCAL")

  # ... run automation

  monitor.stop_monitoring()
  print('Resource Usage:', monitor.get_resource_summary())
  ```
</CodeGroup>

<Card title="LLM Usage" icon="chart-line" href="/configuration/evals">
  Monitor token usage, costs, and speed. Set up automated alerting for critical failures. Implement cost tracking across different environments. Use session analytics to optimize automation workflows.
</Card>

## Real-Time Metrics & Monitoring

### Basic Usage Tracking

Monitor your automation's resource usage in real-time with `stagehand.metrics`:

<CodeGroup>
  ```typescript TypeScript
  // Get current metrics
  console.log(stagehand.metrics);

  // Monitor during automation
  const startTime = Date.now();
  const initialMetrics = stagehand.metrics;

  // ... perform automation tasks

  const finalMetrics = stagehand.metrics;
  const executionTime = Date.now() - startTime;

  console.log('Automation Summary:', {
    totalTokens: finalMetrics.totalPromptTokens + finalMetrics.totalCompletionTokens,
    totalCost: calculateCost(finalMetrics),
    executionTime,
    efficiency: (finalMetrics.totalPromptTokens + finalMetrics.totalCompletionTokens) / executionTime
  });
  ```

  ```python Python
  # Get current metrics
  print(stagehand.metrics)

  # Monitor during automation
  import time
  start_time = time.time()
  initial_metrics = stagehand.metrics

  # ... perform automation tasks

  final_metrics = stagehand.metrics
  execution_time = (time.time() - start_time) * 1000  # Convert to ms

  print('Automation Summary:', {
      'total_tokens': final_metrics['total_prompt_tokens'] + final_metrics['total_completion_tokens'],
      'total_cost': calculate_cost(final_metrics),
      'execution_time': execution_time,
      'efficiency': (final_metrics['total_prompt_tokens'] + final_metrics['total_completion_tokens']) / execution_time
  })
  ```
</CodeGroup>

### Understanding Metrics Data

The metrics object provides detailed breakdown by Stagehand operation:

<CodeGroup>
  ```typescript TypeScript
  {
    actPromptTokens: 4011,
    actCompletionTokens: 51,
    actInferenceTimeMs: 1688,

    extractPromptTokens: 4200,
    extractCompletionTokens: 243,
    extractInferenceTimeMs: 4297,

    observePromptTokens: 347,
    observeCompletionTokens: 43,
    observeInferenceTimeMs: 903,

    totalPromptTokens: 8558,
    totalCompletionTokens: 337,
    totalInferenceTimeMs: 6888
  }
  ```

  ```python Python
  {
    "act_prompt_tokens": 4011,
    "act_completion_tokens": 51,
    "act_inference_time_ms": 1688,

    "extract_prompt_tokens": 4200,
    "extract_completion_tokens": 243,
    "extract_inference_time_ms": 4297,

    "observe_prompt_tokens": 347,
    "observe_completion_tokens": 43,
    "observe_inference_time_ms": 903,

    "total_prompt_tokens": 8558,
    "total_completion_tokens": 337,
    "total_inference_time_ms": 6888
  }
  ```
</CodeGroup>

### Log Inference to File

You can also log inference to a file by setting `logInferenceToFile` to `true`. This will create a directory called `inference_summary` in your project's root directory.

<CodeGroup>
  ```typescript TypeScript
  const stagehand = new Stagehand({
    logInferenceToFile: true,    
  });
  ```

  ```python Python
  stagehand = Stagehand(
      log_inference_to_file=True,             
  )
  ```
</CodeGroup>

The `inference_summary` directory provides granular analysis data:

```
inference_summary/
├── act_summary/
│   ├── {timestamp}.json
│   ├── {timestamp}.json
│   └── ...
│   └── act_summary.json
├── extract_summary/
│   ├── {timestamp}.json
│   ├── {timestamp}.json
│   └── ...
│   └── extract_summary.json
├── observe_summary/
│   ├── {timestamp}.json
│   ├── {timestamp}.json
│   └── ...
│   └── observe_summary.json
```

### Log File Structure

Each operation creates detailed logs for analysis:

```typescript
{
  "act_summary": [
    {
      "act_inference_type": "act",
      "timestamp": "20250329_080446068",
      "LLM_input_file": "20250329_080446068_act_call.txt",
      "LLM_output_file": "20250329_080447019_act_response.txt",
      "prompt_tokens": 3451,
      "completion_tokens": 45,
      "inference_time_ms": 951
    },
    ...
  ],
}
```

## Best Practices

<AccordionGroup>
  <Accordion title="Production Monitoring">
    * Track session success rates and failure patterns
    * Monitor resource usage and scaling requirements
    * Set up automated alerting for critical failures
    * Implement cost tracking across different environments
    * Use session analytics to optimize automation workflows
  </Accordion>

  <Accordion title="Performance Optimization">
    * Compare Browserbase vs local execution times
    * Monitor token usage and inference costs across models
    * Track geographic performance differences
    * Identify bottlenecks in automation workflows
    * Optimize for cost-effectiveness and speed
  </Accordion>

  <Accordion title="Operational Insights">
    * Track session distribution across regions
    * Monitor concurrent session limits and scaling
    * Analyze failure patterns and common error scenarios
    * Use session recordings for root cause analysis
    * Implement custom metadata for workflow categorization
  </Accordion>

  <Accordion title="Integration & Alerting">
    * Integrate session APIs with monitoring dashboards
    * Set up automated notifications for session failures
    * Track SLA compliance and performance benchmarks
    * Monitor resource costs and usage patterns
    * Use analytics data for capacity planning and optimization
  </Accordion>
</AccordionGroup>

For detailed logging and debugging capabilities, see [Logging](/configuration/logging).
