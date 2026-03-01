# Revised Phase 3: UX Polish & Plugin Foundation

**Version**: 1.0.0
**Date**: 2026-03-01
**Focus**: Core user experience improvements, NOT feature expansion

## Philosophy Change

**Old Phase 3**: Add GraphQL, WebSocket, Load Testing, Mock Servers, Code Generation
**New Phase 3**: Perfect the core experience, prepare for extensibility

**Rationale**:
- GraphQL/WebSocket/Load Testing are separate products
- Adding them bloats the codebase
- Users may never use these features
- Plugin architecture allows future expansion without core bloat

## Phase 3 Goals

1. **Make the core experience excellent**
2. **Add essential UX improvements**
3. **Build plugin foundation for future**
4. **Achieve production-ready quality**

## Core UX Improvements

### 1. Request Tabs Interface

**Problem**: Can only work on one request at a time
**Solution**: Multi-tab interface like browser

**Features**:
- Open multiple requests in tabs
- Tab switching with keyboard shortcuts
- Unsaved changes indicator (dot on tab)
- Close tab, close all tabs, close others
- Tab drag-and-drop reordering
- Restore tabs on app restart

**Implementation**:
```typescript
interface RequestTab {
  id: string
  filepath: string
  title: string
  request: BruFile
  modified: boolean
  active: boolean
}

// Tab management
const [tabs, setTabs] = useState<RequestTab[]>([]);
const [activeTabId, setActiveTabId] = useState<string | null>(null);

// Open new tab
function openTab(filepath: string) {
  const existing = tabs.find(t => t.filepath === filepath);
  if (existing) {
    setActiveTabId(existing.id);
    return;
  }

  const newTab: RequestTab = {
    id: generateId(),
    filepath,
    title: path.basename(filepath),
    request: await loadBruFile(filepath),
    modified: false,
    active: true,
  };

  setTabs([...tabs, newTab]);
  setActiveTabId(newTab.id);
}

// Keyboard shortcuts
useKeyboard('Ctrl+W', () => closeTab(activeTabId));
useKeyboard('Ctrl+T', () => openNewTab());
useKeyboard('Ctrl+Tab', () => switchToNextTab());
```

**Priority**: High
**Complexity**: Medium
**Impact**: High (essential for productivity)

### 2. Request History

**Problem**: Lost track of previous requests
**Solution**: Automatic history tracking

**Features**:
- Auto-save every executed request
- History sidebar/panel
- Search history
- Filter by status code, method, URL
- Re-execute from history
- Clear history
- History limit (configurable, default 1000)

**Storage**:
```typescript
interface HistoryEntry {
  id: string
  timestamp: Date
  request: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
  }
  response: {
    status: number
    statusText: string
    time: number
    size: number
    headers: Record<string, string>
    body?: string
  }
  collection?: string
  environment?: string
}

// Store in IndexedDB (not memory, not files)
const historyDB = new HistoryDatabase();

await historyDB.add(historyEntry);
const recent = await historyDB.getRecent(50);
const filtered = await historyDB.search({ method: 'POST', status: 200 });
```

**Priority**: High
**Complexity**: Medium
**Impact**: High (workflow improvement)

### 3. Global Search & Filter

**Problem**: Hard to find requests in large collections
**Solution**: Fast global search

**Features**:
- Search across all collections
- Filter by method, status, name, URL
- Keyboard shortcut to open search (Ctrl+K)
- Fuzzy matching
- Recent searches
- Search results preview

**Implementation**:
```typescript
// Build search index
class SearchIndex {
  private index: Map<string, RequestMetadata[]> = new Map();

  buildIndex(collections: Collection[]) {
    for (const collection of collections) {
      for (const request of collection.requests) {
        // Index by name
        this.addToIndex(request.name.toLowerCase(), request);

        // Index by URL
        this.addToIndex(request.url.toLowerCase(), request);

        // Index by method
        this.addToIndex(request.method.toLowerCase(), request);

        // Index by tags/keywords
        for (const keyword of this.extractKeywords(request)) {
          this.addToIndex(keyword, request);
        }
      }
    }
  }

  search(query: string): RequestMetadata[] {
    const terms = query.toLowerCase().split(' ');
    const results = new Set<RequestMetadata>();

    for (const term of terms) {
      const matches = this.fuzzySearch(term);
      for (const match of matches) {
        results.add(match);
      }
    }

    return Array.from(results);
  }
}

// Command palette UI
function CommandPalette() {
  const [query, setQuery] = useState('');
  const results = useSearch(query);

  return (
    <Modal show={isOpen} onClose={close}>
      <Input
        value={query}
        onChange={setQuery}
        placeholder="Search requests..."
        autoFocus
      />
      <ResultsList results={results} />
    </Modal>
  );
}
```

**Priority**: High
**Complexity**: Medium
**Impact**: High (essential for large collections)

### 4. Keyboard Shortcuts

**Problem**: Too many mouse clicks
**Solution**: Comprehensive keyboard navigation

**Essential Shortcuts**:
```typescript
const SHORTCUTS = {
  // Request execution
  'Ctrl+Enter': 'Send request',
  'Ctrl+Shift+Enter': 'Send and follow redirects',

  // Navigation
  'Ctrl+K': 'Open command palette / search',
  'Ctrl+P': 'Quick open file',
  'Ctrl+B': 'Toggle sidebar',
  'Ctrl+\\': 'Toggle panel',

  // Tabs
  'Ctrl+T': 'New tab',
  'Ctrl+W': 'Close tab',
  'Ctrl+Tab': 'Next tab',
  'Ctrl+Shift+Tab': 'Previous tab',
  'Ctrl+1-9': 'Jump to tab N',

  // File operations
  'Ctrl+S': 'Save current request',
  'Ctrl+Shift+S': 'Save all',
  'Ctrl+N': 'New request',
  'Ctrl+Shift+N': 'New collection',

  // Edit
  'Ctrl+Z': 'Undo',
  'Ctrl+Shift+Z': 'Redo',
  'Ctrl+F': 'Find in current file',
  'Ctrl+H': 'Find and replace',

  // View
  'Ctrl++': 'Zoom in',
  'Ctrl+-': 'Zoom out',
  'Ctrl+0': 'Reset zoom',
  'F11': 'Toggle fullscreen',

  // Developer
  'Ctrl+Shift+I': 'Open DevTools',
  'Ctrl+R': 'Reload app',
};
```

**Implementation**:
```typescript
// Global keyboard handler
function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = getKeyCombo(e);

      switch (key) {
        case 'Ctrl+Enter':
          e.preventDefault();
          sendRequest();
          break;

        case 'Ctrl+K':
          e.preventDefault();
          openCommandPalette();
          break;

        case 'Ctrl+W':
          e.preventDefault();
          closeCurrentTab();
          break;

        // ... handle other shortcuts
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// Show keyboard shortcuts help
function KeyboardShortcutsHelp() {
  return (
    <Modal>
      <h2>Keyboard Shortcuts</h2>
      {Object.entries(SHORTCUTS).map(([key, action]) => (
        <div key={key}>
          <kbd>{key}</kbd> <span>{action}</span>
        </div>
      ))}
    </Modal>
  );
}
```

**Priority**: Medium
**Complexity**: Low
**Impact**: Medium (power user feature)

### 5. Enhanced Error Messages

**Problem**: Cryptic error messages
**Solution**: User-friendly, actionable errors

**See**: `ERROR_HANDLING_FRAMEWORK.md` for complete specification

**Examples**:

Before:
```
Error: ECONNREFUSED
```

After:
```
❌ Cannot Connect to Server

Could not connect to https://api.example.com

This usually means:
• The server is not running
• The URL is incorrect
• A firewall is blocking the connection

[Check URL] [Check Server Status] [Dismiss]
```

**Priority**: High
**Complexity**: Medium (framework already defined)
**Impact**: High (better user experience)

### 6. Settings Panel

**Problem**: No way to configure application
**Solution**: Centralized settings

**Settings Categories**:

**General**:
- Default timeout (default: 30s)
- Max redirects (default: 5)
- Auto-save (default: enabled)
- Theme (light/dark/auto)

**Network**:
- HTTP version (HTTP/1.1, HTTP/2)
- SSL verification (enabled/disabled)
- Proxy settings
- Request retry (attempts, delay)

**Editor**:
- Font size (default: 14px)
- Font family (default: monospace)
- Tab size (default: 2 spaces)
- Word wrap (default: enabled)

**Advanced**:
- Log level (error/warn/info/debug)
- Performance monitoring (enabled/disabled)
- Telemetry (opt-in)
- Developer mode (default: disabled)

**Storage**:
```typescript
// Persist settings to file
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

interface Settings {
  general: {
    timeout: number
    maxRedirects: number
    autoSave: boolean
    theme: 'light' | 'dark' | 'auto'
  }
  network: {
    httpVersion: '1.1' | '2'
    sslVerification: boolean
    proxy?: {
      enabled: boolean
      host: string
      port: number
    }
    retry: {
      attempts: number
      delay: number
    }
  }
  editor: {
    fontSize: number
    fontFamily: string
    tabSize: number
    wordWrap: boolean
  }
  advanced: {
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    performanceMonitoring: boolean
    telemetry: boolean
    developerMode: boolean
  }
}

const defaultSettings: Settings = {
  general: {
    timeout: 30000,
    maxRedirects: 5,
    autoSave: true,
    theme: 'auto',
  },
  // ... other defaults
};
```

**Priority**: Medium
**Complexity**: Low
**Impact**: Medium

### 7. Response Export

**Problem**: Can't save responses for later
**Solution**: Export responses to files

**Features**:
- Export as JSON, XML, HTML, text
- Export headers separately
- Export full request+response
- Copy to clipboard
- Save to file

**Implementation**:
```typescript
function ExportResponse({ response }) {
  const exportOptions = [
    { label: 'Copy Body', action: () => copyToClipboard(response.body) },
    { label: 'Save as JSON', action: () => saveToFile(response.body, 'json') },
    { label: 'Save as Text', action: () => saveToFile(response.body, 'txt') },
    { label: 'Export Full Response', action: () => exportFull(response) },
  ];

  return (
    <DropdownMenu>
      {exportOptions.map(option => (
        <MenuItem key={option.label} onClick={option.action}>
          {option.label}
        </MenuItem>
      ))}
    </DropdownMenu>
  );
}

async function exportFull(response: Response) {
  const data = {
    request: {
      method: response.request.method,
      url: response.request.url,
      headers: response.request.headers,
      body: response.request.body,
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body,
      time: response.time,
      size: response.size,
    },
    timestamp: new Date().toISOString(),
  };

  await saveToFile(JSON.stringify(data, null, 2), 'har');
}
```

**Priority**: Low
**Complexity**: Low
**Impact**: Medium

### 8. Collection Templates

**Problem**: Creating new requests from scratch is tedious
**Solution**: Request templates

**Templates**:
- REST API (GET, POST, PUT, DELETE)
- GraphQL Query
- GraphQL Mutation
- JSON API
- Authentication (Login, Register, Refresh Token)
- File Upload
- WebSocket Connection

**Implementation**:
```typescript
const TEMPLATES = {
  'rest-get': {
    meta: { name: 'Get Resource', type: 'http' },
    http: {
      method: 'GET',
      url: '{{baseUrl}}/resource',
      headers: [
        { key: 'Accept', value: 'application/json' },
      ],
    },
  },

  'rest-post': {
    meta: { name: 'Create Resource', type: 'http' },
    http: {
      method: 'POST',
      url: '{{baseUrl}}/resource',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
      ],
    },
    body: {
      type: 'json',
      data: '{\n  "name": ""\n}',
    },
  },

  'auth-login': {
    meta: { name: 'Login', type: 'http' },
    http: {
      method: 'POST',
      url: '{{baseUrl}}/auth/login',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
      ],
    },
    body: {
      type: 'json',
      data: '{\n  "email": "{{userEmail}}",\n  "password": "{{userPassword}}"\n}',
    },
    script: {
      'post-response': 'const token = res.body.token;\nbru.setEnvVar("authToken", token);',
    },
  },
};

function createFromTemplate(templateName: string) {
  const template = TEMPLATES[templateName];
  const filename = prompt('Request name:');

  createBruFile(filename, template);
}
```

**Priority**: Low
**Complexity**: Low
**Impact**: Medium

## Features REMOVED from Phase 3

Moved to **Plugin Architecture** or **Future Versions**:

### Moved to Plugins

| Feature | Reason | Plugin Name |
|---------|--------|-------------|
| GraphQL Support | Specialized use case | `@rocket/plugin-graphql` |
| WebSocket Support | Specialized protocol | `@rocket/plugin-websocket` |
| Load Testing | Completely different tool | `@rocket/plugin-loadtest` |
| Mock Servers | Complex feature | `@rocket/plugin-mock` |
| Code Generation | Language-specific | `@rocket/plugin-codegen` |
| API Documentation | Complex feature | `@rocket/plugin-docs` |

### Moved to Future Versions

| Feature | Reason | Target Version |
|---------|--------|----------------|
| Team Collaboration | Requires backend infrastructure | v2.0 |
| Cloud Sync | Against core principles | Never |
| Scheduled Monitoring | Complex feature | v1.5 |
| Performance Testing | Different product | Plugin |

## Plugin Architecture Foundation

### Plugin System Design

**Goal**: Allow third-party extensions without bloating core

**Plugin Capabilities**:
- Add new request types (GraphQL, WebSocket, gRPC)
- Add response viewers (custom formats)
- Add pre-request/post-response processors
- Add UI panels/views
- Add authentication methods
- Integrate external tools

**Plugin Structure**:
```typescript
interface Plugin {
  name: string
  version: string
  author: string
  description: string

  // Lifecycle hooks
  onInstall?: () => void
  onEnable?: () => void
  onDisable?: () => void
  onUninstall?: () => void

  // Extension points
  requestTypes?: RequestType[]
  responseViewers?: ResponseViewer[]
  authMethods?: AuthMethod[]
  uiPanels?: UIPanel[]
  processors?: Processor[]
}

// Example plugin
export const graphqlPlugin: Plugin = {
  name: '@rocket/plugin-graphql',
  version: '1.0.0',
  author: 'Rocket Team',
  description: 'GraphQL support for Rocket API',

  requestTypes: [{
    id: 'graphql',
    label: 'GraphQL',
    icon: GraphQLIcon,
    editor: GraphQLEditor,
  }],

  responseViewers: [{
    id: 'graphql-response',
    label: 'GraphQL',
    supports: (response) => response.type === 'graphql',
    render: (response) => <GraphQLResponseViewer data={response} />,
  }],
};
```

**Plugin Registry**:
```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.onInstall?.();
  }

  enable(pluginName: string) {
    const plugin = this.plugins.get(pluginName);
    plugin?.onEnable?.();
  }

  disable(pluginName: string) {
    const plugin = this.plugins.get(pluginName);
    plugin?.onDisable?.();
  }

  getRequestTypes(): RequestType[] {
    return Array.from(this.plugins.values())
      .flatMap(p => p.requestTypes || []);
  }
}
```

**Plugin Loading**:
```typescript
// Plugins directory: ~/.rocket-api/plugins/
const pluginsDir = path.join(app.getPath('userData'), 'plugins');

async function loadPlugins() {
  const pluginDirs = await fs.readdir(pluginsDir);

  for (const dir of pluginDirs) {
    try {
      const pluginPath = path.join(pluginsDir, dir);
      const plugin = await import(pluginPath);

      pluginManager.register(plugin.default);
    } catch (error) {
      console.error(`Failed to load plugin ${dir}:`, error);
    }
  }
}
```

**Priority**: Low (foundation only)
**Complexity**: High
**Impact**: High (enables future extensibility)

## Phase 3 Implementation Plan

### Week 1-2: Request Tabs
- Design tab UI component
- Implement tab state management
- Add keyboard shortcuts
- Save/restore tab state
- **Deliverable**: Multi-tab interface working

### Week 3-4: Request History
- Design history database schema
- Implement IndexedDB storage
- Build history UI panel
- Add search/filter
- **Deliverable**: History fully functional

### Week 5-6: Search & Keyboard Shortcuts
- Build search index
- Implement command palette UI
- Add keyboard shortcut system
- Build shortcut help UI
- **Deliverable**: Fast global search + shortcuts

### Week 7-8: Error Messages & Settings
- Implement error handling framework
- Build settings panel UI
- Add settings persistence
- Improve all error messages
- **Deliverable**: Better errors + configurable settings

### Week 9-10: Export & Templates
- Add response export features
- Create request templates
- Build template picker UI
- **Deliverable**: Complete UX features

### Week 11-12: Plugin Foundation
- Design plugin API
- Implement plugin loading
- Create sample plugin
- Document plugin development
- **Deliverable**: Plugin system ready

### Week 13-14: Polish & Testing
- Performance optimization
- Bug fixes
- Comprehensive testing
- Documentation
- **Deliverable**: Production-ready v1.0

## Success Criteria

Phase 3 is complete when:

- ✅ Can work with multiple requests simultaneously (tabs)
- ✅ Can find previous requests easily (history)
- ✅ Can search across collections quickly (< 200ms)
- ✅ Can navigate entirely by keyboard
- ✅ Errors are clear and actionable
- ✅ App is fully configurable (settings)
- ✅ Can export responses in multiple formats
- ✅ Plugin system is functional (foundation)
- ✅ All performance targets met
- ✅ All tests passing
- ✅ Documentation complete

## What Phase 3 Does NOT Include

**Not in scope**:
- ❌ GraphQL query builder
- ❌ WebSocket client
- ❌ Load testing
- ❌ Mock servers
- ❌ Code generation
- ❌ Team features
- ❌ Cloud sync
- ❌ API monitoring
- ❌ API documentation generation

**These features** are available via plugins or future versions.

## Summary

**Phase 3 Old**: Ambitious feature expansion (GraphQL, WebSocket, Load Testing, etc.)
**Phase 3 New**: Core UX polish + Plugin foundation

**Result**:
- Faster development (14 weeks vs 6+ months)
- Better product (polished core vs half-baked features)
- Extensible (plugins for advanced features)
- Maintainable (smaller core codebase)

**MVP → Phase 1 → Phase 2 → Phase 3 = Production-Ready v1.0**
