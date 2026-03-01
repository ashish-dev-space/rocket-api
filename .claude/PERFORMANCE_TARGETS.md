# Performance Targets

**Version**: 1.0.0
**Date**: 2026-03-01

## Performance Philosophy

Rocket API is designed to be **fast** and **lightweight**. These are not subjective goals - we define specific, measurable targets for every aspect of performance.

**Principles**:
1. **Quantified**: Every target has a number
2. **Measurable**: We can test and verify
3. **User-Centric**: Based on perceived performance
4. **Progressive**: Degrade gracefully under load

## Performance Categories

### 1. Application Startup

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Cold Start** | < 2 seconds | Time from launch to interactive UI | High |
| **Hot Start** | < 500 ms | Subsequent launches (cached) | Medium |
| **Initial Paint** | < 300 ms | Time to first visual content | High |
| **Time to Interactive** | < 1 second | UI fully responsive | High |
| **Memory at Startup** | < 100 MB | RAM usage on launch | Medium |

**Measurement**:
```typescript
const startTime = performance.now();
// ... app initialization
const endTime = performance.now();
console.log(`Startup time: ${endTime - startTime}ms`);
```

### 2. HTTP Request Execution

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Request Overhead** | < 50 ms | Time from "Send" to request starts | High |
| **Variable Substitution** | < 10 ms | Time to resolve all {{variables}} | High |
| **Request Parsing** | < 5 ms | Parse .bru file to request object | Medium |
| **Response Processing** | < 100 ms | Parse and render response | High |
| **Total Request Time** | Network + < 150 ms | End-to-end including overhead | High |

**Example**:
```
User clicks "Send" → 50ms overhead → Network request (variable) → 100ms processing → Display
Total user-perceived time = Network time + 150ms
```

**Measurement**:
```typescript
const metrics = {
  parseStart: performance.now(),
  parseEnd: 0,
  substituteStart: 0,
  substituteEnd: 0,
  networkStart: 0,
  networkEnd: 0,
  processStart: 0,
  processEnd: 0,
};

// Parse .bru file
metrics.parseEnd = performance.now();

// Variable substitution
metrics.substituteStart = performance.now();
const resolvedRequest = substituteVariables(request);
metrics.substituteEnd = performance.now();

// Network request
metrics.networkStart = performance.now();
const response = await fetch(resolvedRequest);
metrics.networkEnd = performance.now();

// Process response
metrics.processStart = performance.now();
const processed = await processResponse(response);
metrics.processEnd = performance.now();

console.log({
  parseTime: metrics.parseEnd - metrics.parseStart,
  substituteTime: metrics.substituteEnd - metrics.substituteStart,
  networkTime: metrics.networkEnd - metrics.networkStart,
  processTime: metrics.processEnd - metrics.processStart,
  totalOverhead: (metrics.parseEnd - metrics.parseStart) +
                 (metrics.substituteEnd - metrics.substituteStart) +
                 (metrics.processEnd - metrics.processStart),
});
```

### 3. File Operations

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Read .bru File** | < 10 ms | Load and parse single file | High |
| **Write .bru File** | < 20 ms | Serialize and save file | High |
| **Load Collection (100 files)** | < 500 ms | Load entire collection | High |
| **Load Collection (1000 files)** | < 2 seconds | Large collection | Medium |
| **File Watch Detection** | < 100 ms | Detect external file change | Medium |
| **File Watch Update** | < 200 ms | Reload changed file in UI | Medium |

**Scaling Targets**:
```
10 files    → < 100 ms
100 files   → < 500 ms
1000 files  → < 2 seconds
10000 files → < 10 seconds (with pagination)
```

**Measurement**:
```typescript
async function measureFileOperations() {
  // Single file read
  const readStart = performance.now();
  const file = await readBruFile('path/to/file.bru');
  const readEnd = performance.now();
  console.log(`Read time: ${readEnd - readStart}ms`);

  // Collection load
  const collectionStart = performance.now();
  const collection = await loadCollection('path/to/collection');
  const collectionEnd = performance.now();
  console.log(`Collection (${collection.files.length} files): ${collectionEnd - collectionStart}ms`);
}
```

### 4. UI Responsiveness

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Frame Rate** | 60 FPS (16.67ms/frame) | Consistent during interactions | High |
| **Click Response** | < 100 ms | Visual feedback on click | High |
| **Input Latency** | < 50 ms | Typing to display | High |
| **Scroll Performance** | 60 FPS | Smooth scrolling | High |
| **Tab Switch** | < 200 ms | Switch between request tabs | Medium |
| **Syntax Highlighting** | < 100 ms | Monaco Editor load time | Medium |

**User Perception**:
- < 100ms: Instant
- 100-300ms: Slight delay, acceptable
- 300-1000ms: Noticeable delay
- \> 1000ms: Unacceptable, show loading indicator

**Measurement**:
```typescript
// Frame rate monitoring
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();

  if (currentTime >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastTime = currentTime;
  }

  requestAnimationFrame(measureFPS);
}

// Click response time
button.addEventListener('click', () => {
  const clickTime = performance.now();
  // ... handle click
  const responseTime = performance.now();
  console.log(`Click response: ${responseTime - clickTime}ms`);
});
```

### 5. Memory Usage

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Baseline** | < 100 MB | App idle, no collections loaded | High |
| **With Small Collection (10 requests)** | < 120 MB | Normal usage | High |
| **With Medium Collection (100 requests)** | < 200 MB | Typical usage | High |
| **With Large Collection (1000 requests)** | < 500 MB | Heavy usage | Medium |
| **Per Request Tab** | < 10 MB | Each open request | Medium |
| **Memory Leak Rate** | 0 MB/hour | Long-running stability | High |
| **Peak Memory** | < 1 GB | Maximum under any scenario | High |

**Memory Limits**:
```
Idle:           < 100 MB
Light usage:    < 200 MB
Normal usage:   < 500 MB
Heavy usage:    < 1 GB
Absolute max:   2 GB (crash prevention)
```

**Measurement**:
```typescript
function measureMemory() {
  if (performance.memory) {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usedMB = (usedJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (jsHeapSizeLimit / 1024 / 1024).toFixed(2);

    console.log(`Memory: ${usedMB} MB / ${limitMB} MB`);

    if (usedJSHeapSize > jsHeapSizeLimit * 0.9) {
      console.warn('Memory usage approaching limit!');
    }
  }
}

// Monitor every 10 seconds
setInterval(measureMemory, 10000);
```

### 6. Search & Filter

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Search 100 Requests** | < 50 ms | Return filtered results | High |
| **Search 1000 Requests** | < 200 ms | Large collection search | Medium |
| **Incremental Search** | < 16 ms per keystroke | Real-time filtering | High |
| **Search Index Build** | < 1 second | Build search index for 1000 files | Low |

**Measurement**:
```typescript
function measureSearch(query: string, requests: Request[]) {
  const start = performance.now();
  const results = searchRequests(query, requests);
  const end = performance.now();

  console.log(`Search ${requests.length} requests: ${end - start}ms`);
  console.log(`Found ${results.length} results`);

  return results;
}
```

### 7. Concurrent Operations

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Max Concurrent Requests** | 10 | Simultaneous HTTP requests | Medium |
| **Request Queue Processing** | < 100 ms/request | Sequential if > max | Medium |
| **Parallel File Reads** | 20 | Simultaneous file operations | Low |
| **Worker Thread Overhead** | < 50 ms | Spawn background worker | Low |

**Concurrency Limits**:
```typescript
const LIMITS = {
  maxConcurrentRequests: 10,
  maxConcurrentFileReads: 20,
  maxOpenTabs: 20,
  maxHistoryEntries: 1000,
  maxCollectionSize: 10000,
};
```

### 8. Data Limits

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Max Request Body Size** | 50 MB | Upload limit | Medium |
| **Max Response Size** | 100 MB | Display limit | Medium |
| **Max .bru File Size** | 1 MB | Individual file | High |
| **Max Collection Files** | 10,000 | Files in one collection | Medium |
| **Max Environment Variables** | 1,000 | Variables per environment | Low |
| **Max Request History** | 1,000 entries | Stored history | Low |

**Size Handling**:
```typescript
function validateRequestSize(body: string) {
  const sizeMB = new Blob([body]).size / 1024 / 1024;

  if (sizeMB > 50) {
    throw new Error(`Request body too large: ${sizeMB.toFixed(2)} MB (max: 50 MB)`);
  }
}

function handleLargeResponse(response: Response) {
  const contentLength = response.headers.get('content-length');
  const sizeMB = parseInt(contentLength) / 1024 / 1024;

  if (sizeMB > 100) {
    return {
      truncated: true,
      message: `Response too large to display: ${sizeMB.toFixed(2)} MB`,
      downloadUrl: createDownloadLink(response),
    };
  }

  return response.text();
}
```

## Performance Testing

### Load Testing Scenarios

**Scenario 1: Small Collection**
- 10 requests
- 2 environments
- Expected: All operations < target times
- Test frequency: Every commit

**Scenario 2: Medium Collection**
- 100 requests
- 5 environments
- Expected: Collection load < 500ms
- Test frequency: Daily

**Scenario 3: Large Collection**
- 1,000 requests
- 10 environments
- Expected: Collection load < 2s
- Test frequency: Weekly

**Scenario 4: Stress Test**
- 10,000 requests
- 50 environments
- Expected: Graceful degradation, no crash
- Test frequency: Before release

### Performance Test Suite

```typescript
describe('Performance Tests', () => {
  it('should load small collection quickly', async () => {
    const start = performance.now();
    const collection = await loadCollection('./test/fixtures/small-collection');
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
    expect(collection.requests.length).toBe(10);
  });

  it('should execute request with minimal overhead', async () => {
    const request = createTestRequest();

    const start = performance.now();
    const response = await executeRequest(request);
    const end = performance.now();

    const overhead = (end - start) - response.networkTime;
    expect(overhead).toBeLessThan(150);
  });

  it('should handle 60 FPS during scroll', async () => {
    const fpsMonitor = new FPSMonitor();

    // Simulate scrolling
    for (let i = 0; i < 100; i++) {
      scrollList(100);
      await nextFrame();
    }

    const avgFPS = fpsMonitor.getAverage();
    expect(avgFPS).toBeGreaterThanOrEqual(55); // Allow 5 FPS drop
  });

  it('should not leak memory', async () => {
    const initialMemory = getMemoryUsage();

    // Perform operations
    for (let i = 0; i < 100; i++) {
      const collection = await loadCollection('./test/fixtures/collection');
      await unloadCollection(collection);
    }

    // Force GC if available
    if (global.gc) global.gc();

    const finalMemory = getMemoryUsage();
    const leak = finalMemory - initialMemory;

    expect(leak).toBeLessThan(10 * 1024 * 1024); // < 10 MB leak
  });
});
```

### Continuous Performance Monitoring

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric).push(value);
  }

  getStats(metric: string) {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  report() {
    const report = {};
    for (const [metric, _] of this.metrics) {
      report[metric] = this.getStats(metric);
    }
    return report;
  }
}

// Usage
const monitor = new PerformanceMonitor();

async function executeRequestWithMonitoring(request: Request) {
  const start = performance.now();
  const response = await executeRequest(request);
  const end = performance.now();

  monitor.record('request_execution', end - start);

  return response;
}

// Periodic reporting
setInterval(() => {
  console.log('Performance Report:', monitor.report());
}, 60000); // Every minute
```

## Performance Budgets

### Bundle Size Budgets

| Bundle | Target | Max | Priority |
|--------|--------|-----|----------|
| **Main Bundle (JS)** | < 500 KB | 1 MB | High |
| **CSS** | < 50 KB | 100 KB | Medium |
| **Vendor (Third-party)** | < 300 KB | 500 KB | Medium |
| **Monaco Editor** | < 1 MB | 1.5 MB | Low |
| **Total Initial Load** | < 1 MB | 2 MB | High |

**Code Splitting**:
```typescript
// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Lazy load large components
const ResponseViewer = lazy(() => import('./ResponseViewer'));
```

### Network Budgets

| Resource | Target | Max | Priority |
|----------|--------|-----|----------|
| **API Endpoint (Backend)** | < 10 ms | 50 ms | High |
| **Static Assets** | < 100 ms | 300 ms | Medium |
| **Font Loading** | < 200 ms | 500 ms | Low |

## Performance Optimization Strategies

### 1. Request Execution

```typescript
// Cache parsed requests
const requestCache = new Map<string, ParsedRequest>();

function getCachedRequest(filepath: string): ParsedRequest | null {
  return requestCache.get(filepath) || null;
}

// Reuse HTTP clients
const httpClient = createHTTPClient({
  keepAlive: true,
  maxSockets: 10,
  timeout: 30000,
});
```

### 2. Collection Loading

```typescript
// Lazy load requests
async function loadCollectionLazy(path: string) {
  // Load metadata first (fast)
  const metadata = await loadCollectionMetadata(path);

  // Load request details on demand
  return {
    ...metadata,
    loadRequest: async (filename: string) => {
      return await loadBruFile(join(path, filename));
    },
  };
}

// Virtual scrolling for large lists
function RequestList({ requests }) {
  return (
    <VirtualScroller
      items={requests}
      itemHeight={50}
      renderItem={(request) => <RequestItem request={request} />}
    />
  );
}
```

### 3. Memory Management

```typescript
// Cleanup on unmount
useEffect(() => {
  const subscription = loadCollection(path);

  return () => {
    subscription.cleanup(); // Release memory
  };
}, [path]);

// Implement pagination for large collections
const ITEMS_PER_PAGE = 50;

function usePaginatedRequests(requests: Request[]) {
  const [page, setPage] = useState(1);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return requests.slice(start, start + ITEMS_PER_PAGE);
  }, [requests, page]);

  return { paginatedRequests, page, setPage };
}
```

### 4. Debouncing & Throttling

```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

// Throttle file watcher events
const throttledFileUpdate = throttle((filepath: string) => {
  reloadFile(filepath);
}, 100);
```

## Performance Checklist

Before releasing any version, verify:

- [ ] All startup metrics within targets
- [ ] Request execution overhead < 150ms
- [ ] Collection loading times acceptable
- [ ] UI maintains 60 FPS
- [ ] Memory usage within limits
- [ ] No memory leaks (24hr test)
- [ ] Bundle sizes under budget
- [ ] Large file handling works
- [ ] Performance tests passing
- [ ] Monitoring in place

## Performance Regression Detection

### Automated Checks

```typescript
// CI/CD performance gate
async function performanceGate() {
  const results = await runPerformanceTests();

  const failures = [];

  if (results.startupTime > 2000) {
    failures.push(`Startup too slow: ${results.startupTime}ms`);
  }

  if (results.requestOverhead > 150) {
    failures.push(`Request overhead too high: ${results.requestOverhead}ms`);
  }

  if (results.memoryUsage > 100 * 1024 * 1024) {
    failures.push(`Memory usage too high: ${results.memoryUsage} bytes`);
  }

  if (failures.length > 0) {
    throw new Error(`Performance regression detected:\n${failures.join('\n')}`);
  }
}
```

## Summary

**Key Targets to Remember**:

- 🚀 **Startup**: < 2s
- ⚡ **Request Overhead**: < 150ms total
- 📁 **File Operations**: < 10ms read, < 20ms write
- 🖥️ **UI**: 60 FPS consistent
- 💾 **Memory**: < 100 MB idle, < 500 MB normal use
- 📦 **Bundle**: < 2 MB total

These targets ensure Rocket API feels **fast and lightweight** compared to competitors.
