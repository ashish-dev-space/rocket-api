# Script Console & Test Results Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture `console.log` output from pre/post scripts and surface it in the Console panel; display `pm.test()` results in a new "Tests" tab in the response panel.

**Architecture:** Backend goja VM gains a `console` object that appends to `ExecutionResult.ConsoleLogs`. The frontend type system propagates those logs + test results through `HttpResponse → ConsoleEntry`. The response panel gains a Tests tab; the Console panel entry detail gains a Script Logs section.

**Tech Stack:** Go / goja (backend), React 19 + TypeScript, Zustand, Tailwind CSS (frontend), Vitest + Go testing (tests)

---

## File Map

| File | Change |
|------|--------|
| `backend/internal/app/scripting/runtime.go` | Add `ConsoleLogs []string` to `ExecutionResult`; register `console` object in goja VM |
| `backend/internal/app/scripting/runtime_test.go` | Add test: `console.log` is captured |
| `frontend/src/types/index.ts` | Add `ScriptResult` interface; add `consoleLogs` to `ConsoleEntry`; add `scriptResult`/`preScriptResult` to `HttpResponse` |
| `frontend/src/lib/api.ts` | Map `scriptResult`/`preScriptResult`/`consoleLogs` from raw API response into returned `HttpResponse` |
| `frontend/src/store/console.ts` | Extend `addEntry` to accept `consoleLogs?: string[]`; store them on `ConsoleEntry` |
| `frontend/src/store/__tests__/console.test.ts` | Add test: `addEntry` stores consoleLogs |
| `frontend/src/components/request-builder/RequestBuilderResponsePanel.tsx` | Add "Tests" tab showing `pm.test()` results with pass/fail indicators |
| `frontend/src/components/layout/ConsolePanel.tsx` | Add "Script Logs" section in `EntryDetail` when `consoleLogs` is non-empty |

---

## Task 1: Backend — capture `console.log` in goja VM

**Files:**
- Modify: `backend/internal/app/scripting/runtime.go`

- [ ] **Step 1: Add `ConsoleLogs` field to `ExecutionResult`**

In `runtime.go`, update the struct:

```go
// ExecutionResult stores script execution outputs.
type ExecutionResult struct {
	Tests       []TestResult      `json:"tests,omitempty"`
	Variables   map[string]string `json:"variables,omitempty"`
	ConsoleLogs []string          `json:"consoleLogs,omitempty"`
}
```

- [ ] **Step 2: Register `console` object before running the VM**

In `executeScript`, after `result := &ExecutionResult{...}` and before `vm.Set("pm", pmObject)`, add:

```go
consoleObject := vm.NewObject()
consoleObject.Set("log", func(call goja.FunctionCall) goja.Value {
    parts := make([]string, len(call.Arguments))
    for i, arg := range call.Arguments {
        parts[i] = arg.String()
    }
    result.ConsoleLogs = append(result.ConsoleLogs, strings.Join(parts, " "))
    return goja.Undefined()
})
consoleObject.Set("warn", consoleObject.Get("log"))
consoleObject.Set("error", consoleObject.Get("log"))
consoleObject.Set("info", consoleObject.Get("log"))
if err := vm.Set("console", consoleObject); err != nil {
    return nil, fmt.Errorf("failed to initialize console object: %w", err)
}
```

- [ ] **Step 3: Build to verify no compile errors**

```bash
cd backend && go build ./...
```

Expected: no output (clean build)

- [ ] **Step 4: Commit**

```bash
cd backend
git add internal/app/scripting/runtime.go
git commit -m "feat(scripting): capture console.log output in ExecutionResult"
```

---

## Task 2: Backend — test `console.log` capture

**Files:**
- Modify: `backend/internal/app/scripting/runtime_test.go`

- [ ] **Step 1: Add failing test**

Append to `runtime_test.go`:

```go
func TestExecuteScript_CapturesConsoleLogs(t *testing.T) {
	req := &RequestState{
		Method:  "GET",
		URL:     "https://api.example.com",
		Headers: map[string]string{},
	}
	script := `
console.log('hello', 'world')
console.log(42)
`
	result, err := ExecutePreRequestScript(script, "javascript", req, map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.ConsoleLogs) != 2 {
		t.Fatalf("ConsoleLogs: want 2 entries, got %d: %v", len(result.ConsoleLogs), result.ConsoleLogs)
	}
	if result.ConsoleLogs[0] != "hello world" {
		t.Errorf("ConsoleLogs[0]: want %q, got %q", "hello world", result.ConsoleLogs[0])
	}
	if result.ConsoleLogs[1] != "42" {
		t.Errorf("ConsoleLogs[1]: want %q, got %q", "42", result.ConsoleLogs[1])
	}
}
```

- [ ] **Step 2: Run test to verify it fails (not yet implemented)**

```bash
cd backend && go test ./internal/app/scripting/... -run TestExecuteScript_CapturesConsoleLogs -v
```

Expected: FAIL — if Task 1 is already done, skip this step and go straight to Step 3.

- [ ] **Step 3: Run test to verify it passes**

```bash
cd backend && go test ./internal/app/scripting/... -v
```

Expected: all PASS including `TestExecuteScript_CapturesConsoleLogs`

- [ ] **Step 4: Commit**

```bash
git add backend/internal/app/scripting/runtime_test.go
git commit -m "test(scripting): verify console.log output is captured"
```

---

## Task 3: Frontend types — add `ScriptResult`, extend `HttpResponse` and `ConsoleEntry`

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add `ScriptResult` interface after the `Scripts` interface**

```typescript
export interface ScriptTestResult {
  name: string
  passed: boolean
  error?: string
}

export interface ScriptResult {
  tests: ScriptTestResult[]
  variables: Record<string, string>
  consoleLogs: string[]
}
```

- [ ] **Step 2: Extend `HttpResponse` to carry script results**

Change:
```typescript
export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  time: number
}
```

To:
```typescript
export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  time: number
  preScriptResult?: ScriptResult
  scriptResult?: ScriptResult
}
```

- [ ] **Step 3: Add `consoleLogs` to `ConsoleEntry`**

Change:
```typescript
export interface ConsoleEntry {
  id: string
  timestamp: string
  method: HttpMethod
  url: string
  status: number
  statusText: string
  duration: number
  size: number
  requestHeaders: Record<string, string>
  requestBody: string
  responseHeaders: Record<string, string>
  responseBody: string
}
```

To:
```typescript
export interface ConsoleEntry {
  id: string
  timestamp: string
  method: HttpMethod
  url: string
  status: number
  statusText: string
  duration: number
  size: number
  requestHeaders: Record<string, string>
  requestBody: string
  responseHeaders: Record<string, string>
  responseBody: string
  consoleLogs: string[]
  scriptTests: ScriptTestResult[]
}
```

- [ ] **Step 4: Check for type errors**

```bash
cd frontend && yarn tsc --noEmit 2>&1 | head -30
```

Expected: errors only in files that use `HttpResponse` or `ConsoleEntry` (to be fixed in subsequent tasks)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(types): add ScriptResult, extend HttpResponse and ConsoleEntry"
```

---

## Task 4: Frontend — pass script results through `api.ts`

**Files:**
- Modify: `frontend/src/lib/api.ts`

The `sendRequest` method currently returns a manually constructed `HttpResponse`, discarding `preScriptResult`/`scriptResult` fields from the raw API data. Fix this.

- [ ] **Step 1: Update the return mapping in `sendRequest`**

In the `try` block, the current return statement is:
```typescript
return {
  status: response.data.data.status,
  statusText: response.data.data.statusText,
  headers: response.data.data.headers,
  body: this.normalizeBody(response.data.data.body),
  size: response.data.data.size,
  time: endTime - startTime
}
```

Change it to:
```typescript
const raw = response.data.data as HttpResponse & {
  preScriptResult?: ScriptResult
  scriptResult?: ScriptResult
}
return {
  status: raw.status,
  statusText: raw.statusText,
  headers: raw.headers,
  body: this.normalizeBody(raw.body),
  size: raw.size,
  time: endTime - startTime,
  preScriptResult: raw.preScriptResult,
  scriptResult: raw.scriptResult,
}
```

- [ ] **Step 2: Add `ScriptResult` to the import at the top of `api.ts`**

Change:
```typescript
import { HttpRequest, HttpResponse, ApiResponse, Environment, HistoryEntry, Template, Cookie, CollectionVar } from '@/types'
```
To:
```typescript
import { HttpRequest, HttpResponse, ScriptResult, ApiResponse, Environment, HistoryEntry, Template, Cookie, CollectionVar } from '@/types'
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && yarn tsc --noEmit 2>&1 | head -30
```

Expected: fewer errors than before (api.ts is now clean)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(api): propagate script results through sendRequest response"
```

---

## Task 5: Frontend — store consoleLogs in console Zustand store

**Files:**
- Modify: `frontend/src/store/console.ts`

- [ ] **Step 1: Update `addEntry` to merge consoleLogs from both script results**

The current `addEntry` signature is `(req: HttpRequest, res: HttpResponse)`. `res` now optionally carries `preScriptResult` and `scriptResult`.

Replace the `addEntry` implementation:

```typescript
addEntry: (req, res) => {
  const consoleLogs = [
    ...(res.preScriptResult?.consoleLogs ?? []),
    ...(res.scriptResult?.consoleLogs ?? []),
  ]
  const scriptTests = [
    ...(res.preScriptResult?.tests ?? []),
    ...(res.scriptResult?.tests ?? []),
  ]
  const entry: ConsoleEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: res.status,
    statusText: res.statusText,
    duration: res.time,
    size: res.size,
    requestHeaders: req.headers
      .filter(h => h.enabled)
      .reduce<Record<string, string>>((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
    requestBody: formatRequestBody(req.body),
    responseHeaders: res.headers,
    responseBody: res.body,
    consoleLogs,
    scriptTests,
  }
  set(state => ({
    entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
  }))
},
```

- [ ] **Step 2: Check for type errors**

```bash
cd frontend && yarn tsc --noEmit 2>&1 | head -30
```

Expected: console.ts is clean; remaining errors should only be in the UI components (next tasks)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/console.ts
git commit -m "feat(store): store script consoleLogs and test results in ConsoleEntry"
```

---

## Task 6: Frontend — test consoleLogs stored correctly

**Files:**
- Modify: `frontend/src/store/__tests__/console.test.ts`

- [ ] **Step 1: Add failing test**

Append to `console.test.ts`:

```typescript
it('stores consoleLogs from script results', () => {
  const resWithLogs: HttpResponse = {
    ...mockRes,
    preScriptResult: {
      tests: [],
      variables: {},
      consoleLogs: ['pre log 1'],
    },
    scriptResult: {
      tests: [{ name: 'status ok', passed: true }],
      variables: {},
      consoleLogs: ['post log 1', 'post log 2'],
    },
  }
  useConsoleStore.getState().addEntry(mockReq, resWithLogs)
  const entry = useConsoleStore.getState().entries[0]
  expect(entry.consoleLogs).toEqual(['pre log 1', 'post log 1', 'post log 2'])
  expect(entry.scriptTests).toHaveLength(1)
  expect(entry.scriptTests[0].name).toBe('status ok')
  expect(entry.scriptTests[0].passed).toBe(true)
})

it('stores empty consoleLogs when no scripts ran', () => {
  useConsoleStore.getState().addEntry(mockReq, mockRes)
  const entry = useConsoleStore.getState().entries[0]
  expect(entry.consoleLogs).toEqual([])
  expect(entry.scriptTests).toEqual([])
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd frontend && yarn test src/store/__tests__/console.test.ts
```

Expected: all PASS

- [ ] **Step 3: Run full frontend test suite**

```bash
cd frontend && yarn test
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/store/__tests__/console.test.ts
git commit -m "test(store): verify consoleLogs and scriptTests stored in ConsoleEntry"
```

---

## Task 7: Frontend — "Tests" tab in response panel

**Files:**
- Modify: `frontend/src/components/request-builder/RequestBuilderResponsePanel.tsx`

- [ ] **Step 1: Update props to accept script results and add Tests tab trigger**

Update the component's props interface and add the Tests tab tab trigger. The `response` prop already has `scriptResult`/`preScriptResult` after Task 3 extended `HttpResponse`.

Change the `TabsList` section from:
```tsx
<TabsList className="h-7 bg-transparent">
  <TabsTrigger value="body" className="text-xs h-6 data-[state=active]:bg-background">Body</TabsTrigger>
  <TabsTrigger value="headers" className="text-xs h-6 data-[state=active]:bg-background">Headers</TabsTrigger>
</TabsList>
```

To:
```tsx
<TabsList className="h-7 bg-transparent">
  <TabsTrigger value="body" className="text-xs h-6 data-[state=active]:bg-background">Body</TabsTrigger>
  <TabsTrigger value="headers" className="text-xs h-6 data-[state=active]:bg-background">Headers</TabsTrigger>
  <TabsTrigger value="tests" className="text-xs h-6 data-[state=active]:bg-background">
    Tests
    {allTests.length > 0 && (
      <span className={`ml-1 text-[10px] font-semibold px-1 rounded ${failCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
        {passCount}/{allTests.length}
      </span>
    )}
  </TabsTrigger>
</TabsList>
```

- [ ] **Step 2: Compute test summary in the component body**

Add after `const formattedBody = ...`:

```typescript
const allTests = useMemo(() => [
  ...(response?.preScriptResult?.tests ?? []),
  ...(response?.scriptResult?.tests ?? []),
], [response])

const passCount = useMemo(() => allTests.filter(t => t.passed).length, [allTests])
const failCount = allTests.length - passCount
```

Add `ScriptTestResult` to the import from `@/types`.

- [ ] **Step 3: Add Tests tab content panel**

After the `{responseTab === 'headers' && ...}` block, add:

```tsx
{responseTab === 'tests' && (
  <div className="space-y-1">
    {allTests.length === 0 ? (
      <p className="text-xs text-muted-foreground py-4 text-center">
        No tests ran. Use <code className="font-mono bg-muted px-1 rounded">pm.test()</code> in your scripts.
      </p>
    ) : (
      <>
        <div className="text-xs text-muted-foreground mb-2">
          {passCount} passed · {failCount} failed
        </div>
        {allTests.map((t, i) => (
          <div key={i} className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${t.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span className="font-bold shrink-0">{t.passed ? '✓' : '✗'}</span>
            <div className="min-w-0">
              <span className="font-medium">{t.name}</span>
              {t.error && <div className="text-[11px] opacity-75 mt-0.5 font-mono">{t.error}</div>}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
)}
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && yarn tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `RequestBuilderResponsePanel.tsx`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/request-builder/RequestBuilderResponsePanel.tsx
git commit -m "feat(ui): add Tests tab to response panel showing pm.test() results"
```

---

## Task 8: Frontend — script logs in Console panel

**Files:**
- Modify: `frontend/src/components/layout/ConsolePanel.tsx`

- [ ] **Step 1: Add Script Logs section to `EntryDetail`**

The `EntryDetail` component currently renders a 2×2 grid for headers and body. Add a full-width section below it for script logs, wrapping in a conditional so it only renders when there's output.

Replace the closing `</div>` of `EntryDetail`'s outer `<div>`:

Change:
```tsx
function EntryDetail({ entry }: { entry: ConsoleEntry }) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-2 bg-muted/30 border-t text-[11px]">
      <div>
        <div className="font-medium text-muted-foreground mb-1">Request Headers</div>
        <div className="font-mono bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
          <HeaderTable headers={entry.requestHeaders} />
        </div>
      </div>
      <div>
        <div className="font-medium text-muted-foreground mb-1">Request Body</div>
        <pre className="font-mono whitespace-pre-wrap break-all bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
          {entry.requestBody || '(empty)'}
        </pre>
      </div>
      <div>
        <div className="font-medium text-muted-foreground mb-1">Response Headers</div>
        <div className="font-mono bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
          <HeaderTable headers={entry.responseHeaders} />
        </div>
      </div>
      <div>
        <div className="font-medium text-muted-foreground mb-1">Response Body</div>
        <pre className="font-mono whitespace-pre-wrap break-all bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
          {entry.responseBody || '(empty)'}
        </pre>
      </div>
    </div>
  )
}
```

To:
```tsx
function EntryDetail({ entry }: { entry: ConsoleEntry }) {
  return (
    <div className="px-4 py-2 bg-muted/30 border-t text-[11px] space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-medium text-muted-foreground mb-1">Request Headers</div>
          <div className="font-mono bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
            <HeaderTable headers={entry.requestHeaders} />
          </div>
        </div>
        <div>
          <div className="font-medium text-muted-foreground mb-1">Request Body</div>
          <pre className="font-mono whitespace-pre-wrap break-all bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
            {entry.requestBody || '(empty)'}
          </pre>
        </div>
        <div>
          <div className="font-medium text-muted-foreground mb-1">Response Headers</div>
          <div className="font-mono bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
            <HeaderTable headers={entry.responseHeaders} />
          </div>
        </div>
        <div>
          <div className="font-medium text-muted-foreground mb-1">Response Body</div>
          <pre className="font-mono whitespace-pre-wrap break-all bg-background/60 rounded p-1.5 max-h-32 overflow-auto">
            {entry.responseBody || '(empty)'}
          </pre>
        </div>
      </div>
      {entry.consoleLogs.length > 0 && (
        <div>
          <div className="font-medium text-muted-foreground mb-1">Script Logs</div>
          <div className="font-mono bg-background/60 rounded p-1.5 max-h-40 overflow-auto space-y-0.5">
            {entry.consoleLogs.map((line, i) => (
              <div key={i} className="text-foreground/80 whitespace-pre-wrap break-all">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && yarn tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Run full test suite to confirm nothing regressed**

```bash
cd frontend && yarn test
cd backend && go test ./...
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/ConsolePanel.tsx
git commit -m "feat(ui): show script console logs in Console panel entry detail"
```

---

## Task 9: Verify end-to-end

- [ ] **Step 1: Start dev servers**

```bash
# Terminal 1
cd backend && go run cmd/server/main.go

# Terminal 2
cd frontend && yarn dev
```

- [ ] **Step 2: Manual smoke test**

1. Open a request, go to "Scripts" tab
2. In Post-response script, enter:
   ```javascript
   console.log('status:', pm.response.code)
   pm.test('status is 200', () => {
     if (pm.response.code !== 200) throw new Error('not 200')
   })
   ```
3. Send the request
4. Verify: "Tests" tab appears in response panel with ✓ indicator
5. Open Console panel, expand the entry — "Script Logs" section shows `status: 200`

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for script console and test results"
```
