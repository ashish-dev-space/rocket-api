# Error Handling Framework

**Version**: 1.0.0
**Date**: 2026-03-01

## Philosophy

Error handling in Rocket API follows these principles:

1. **User-Friendly**: Clear, actionable error messages
2. **Recoverable**: Provide recovery actions when possible
3. **Informative**: Include technical details for debugging
4. **Consistent**: Uniform error structure across application
5. **Logged**: All errors logged for troubleshooting

## Error Taxonomy

### Error Categories

```typescript
enum ErrorCategory {
  NETWORK = 'NETWORK',           // HTTP request failures
  FILE_SYSTEM = 'FILE_SYSTEM',   // File operations
  PARSING = 'PARSING',           // .bru file parsing
  VALIDATION = 'VALIDATION',     // Input validation
  RUNTIME = 'RUNTIME',           // Application errors
  SECURITY = 'SECURITY',         // Security violations
}
```

### Error Severity

```typescript
enum ErrorSeverity {
  FATAL = 'FATAL',       // App cannot continue, must exit
  ERROR = 'ERROR',       // Operation failed, but app continues
  WARNING = 'WARNING',   // Potential issue, operation continues
  INFO = 'INFO',         // Informational, no action needed
}
```

## Error Structure

### Base Error Interface

```typescript
interface RocketAPIError {
  // Identification
  id: string              // Unique error ID (for support)
  code: string            // Error code (e.g., "NET_001")
  category: ErrorCategory
  severity: ErrorSeverity

  // Messages
  userMessage: string     // What user sees
  technicalMessage: string // For developers/logs

  // Context
  timestamp: Date
  context: Record<string, any> // Additional data

  // Stack trace (for technical errors)
  stack?: string

  // Recovery
  recoverable: boolean
  recoveryActions: RecoveryAction[]

  // Retry
  retryable: boolean
  retryAttempt?: number
  maxRetries?: number
}

interface RecoveryAction {
  label: string           // "Retry", "Choose File", etc.
  action: string          // Action identifier
  primary: boolean        // Is this the recommended action?
}
```

## Error Codes

### Format

`<CATEGORY>_<SUBCATEGORY>_<NUMBER>`

Example: `NET_TIMEOUT_001`, `FILE_READ_002`, `PARSE_SYNTAX_003`

### Code Registry

#### NETWORK Errors (NET_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `NET_TIMEOUT_001` | Request Timeout | Request timed out after {timeout}ms | Retry, Increase timeout |
| `NET_REFUSED_002` | Connection Refused | Could not connect to {url} | Check URL, Check server |
| `NET_DNS_003` | DNS Resolution Failed | Cannot resolve hostname {hostname} | Check internet, Check hostname |
| `NET_SSL_004` | SSL Certificate Error | SSL certificate invalid for {hostname} | Add exception, Check certificate |
| `NET_ABORT_005` | Request Aborted | Request was canceled | Retry |
| `NET_PROXY_006` | Proxy Error | Cannot connect through proxy {proxy} | Check proxy, Disable proxy |
| `NET_UNREACHABLE_007` | Host Unreachable | Network unreachable to {url} | Check connection |
| `NET_4XX_008` | Client Error | Server returned {status}: {message} | Check request |
| `NET_5XX_009` | Server Error | Server error {status}: {message} | Retry later |

#### FILE_SYSTEM Errors (FILE_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `FILE_NOT_FOUND_001` | File Not Found | File not found: {path} | Check path, Create file |
| `FILE_READ_002` | Read Error | Cannot read file: {path} | Check permissions |
| `FILE_WRITE_003` | Write Error | Cannot write to file: {path} | Check permissions, Check disk space |
| `FILE_DELETE_004` | Delete Error | Cannot delete file: {path} | Check permissions, Close file |
| `FILE_PERMISSION_005` | Permission Denied | Access denied: {path} | Grant permissions |
| `FILE_LOCKED_006` | File Locked | File is locked: {path} | Close other apps |
| `FILE_CORRUPT_007` | Corrupted File | File is corrupted: {path} | Restore backup, Recreate |
| `FILE_DISK_FULL_008` | Disk Full | No space left on device | Free up space |
| `FILE_PATH_INVALID_009` | Invalid Path | Invalid file path: {path} | Check path format |
| `FILE_WATCH_010` | Watch Error | Cannot watch directory: {path} | Check permissions |

#### PARSING Errors (PARSE_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `PARSE_SYNTAX_001` | Syntax Error | Syntax error in {file} at line {line} | Fix syntax |
| `PARSE_MISSING_SECTION_002` | Missing Section | Required section '{section}' missing | Add section |
| `PARSE_INVALID_FIELD_003` | Invalid Field | Invalid field '{field}' in section '{section}' | Fix or remove field |
| `PARSE_INVALID_VALUE_004` | Invalid Value | Invalid value for '{field}': {value} | Correct value |
| `PARSE_JSON_005` | JSON Parse Error | Invalid JSON in body: {error} | Fix JSON syntax |
| `PARSE_XML_006` | XML Parse Error | Invalid XML in body: {error} | Fix XML syntax |
| `PARSE_CIRCULAR_VAR_007` | Circular Variable | Circular variable reference: {chain} | Break cycle |
| `PARSE_ENCODING_008` | Encoding Error | File encoding error: expected UTF-8 | Convert to UTF-8 |
| `PARSE_SIZE_009` | File Too Large | File exceeds max size: {size} | Reduce file size |

#### VALIDATION Errors (VAL_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `VAL_URL_001` | Invalid URL | Invalid URL: {url} | Correct URL format |
| `VAL_METHOD_002` | Invalid Method | Invalid HTTP method: {method} | Use valid method |
| `VAL_HEADER_003` | Invalid Header | Invalid header: {header} | Fix header format |
| `VAL_AUTH_004` | Auth Config Error | Invalid auth configuration | Check auth settings |
| `VAL_VAR_NOT_FOUND_005` | Variable Not Found | Variable not found: {variable} | Define variable |
| `VAL_REQUIRED_FIELD_006` | Required Field | Required field missing: {field} | Add field |
| `VAL_TYPE_MISMATCH_007` | Type Mismatch | Expected {expected}, got {actual} | Correct type |
| `VAL_RANGE_008` | Out of Range | Value out of range: {value} | Use valid range |
| `VAL_FORMAT_009` | Invalid Format | Invalid format for {field} | Use correct format |
| `VAL_DUPLICATE_010` | Duplicate Entry | Duplicate {item}: {value} | Remove duplicate |

#### RUNTIME Errors (RT_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `RT_OUT_OF_MEMORY_001` | Out of Memory | Application out of memory | Restart app, Close tabs |
| `RT_UNEXPECTED_002` | Unexpected Error | An unexpected error occurred | Retry, Report bug |
| `RT_CONFIG_003` | Configuration Error | Invalid configuration: {config} | Reset config |
| `RT_STATE_004` | Invalid State | Invalid application state | Refresh app |
| `RT_DEPENDENCY_005` | Dependency Error | Required dependency missing | Reinstall app |
| `RT_VERSION_006` | Version Mismatch | Incompatible version: {version} | Update app |

#### SECURITY Errors (SEC_xxx_xxx)

| Code | Name | User Message | Recovery |
|------|------|--------------|----------|
| `SEC_PATH_TRAVERSAL_001` | Path Traversal | Invalid file path detected | Use valid path |
| `SEC_UNSAFE_URL_002` | Unsafe URL | URL blocked for security | Use safe URL |
| `SEC_CERT_INVALID_003` | Invalid Certificate | SSL certificate verification failed | Trust cert, Fix cert |
| `SEC_TOKEN_EXPIRED_004` | Token Expired | Authentication token expired | Re-authenticate |

## Error Handling Patterns

### Network Errors

```typescript
async function executeRequest(request: Request): Promise<Response> {
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      timeout: request.timeout || 30000,
    });

    return response;

  } catch (error) {
    // Network timeout
    if (error.name === 'TimeoutError') {
      throw new RocketAPIError({
        code: 'NET_TIMEOUT_001',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.ERROR,
        userMessage: `Request timed out after ${request.timeout}ms`,
        technicalMessage: `Timeout on ${request.method} ${request.url}`,
        context: { url: request.url, timeout: request.timeout },
        recoverable: true,
        retryable: true,
        recoveryActions: [
          { label: 'Retry', action: 'retry', primary: true },
          { label: 'Increase Timeout', action: 'increase_timeout', primary: false },
        ],
      });
    }

    // Connection refused
    if (error.code === 'ECONNREFUSED') {
      throw new RocketAPIError({
        code: 'NET_REFUSED_002',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.ERROR,
        userMessage: `Could not connect to ${request.url}`,
        technicalMessage: `Connection refused: ${error.message}`,
        context: { url: request.url },
        recoverable: true,
        retryable: false,
        recoveryActions: [
          { label: 'Check URL', action: 'check_url', primary: true },
          { label: 'Check Server', action: 'check_server', primary: false },
        ],
      });
    }

    // DNS error
    if (error.code === 'ENOTFOUND') {
      throw new RocketAPIError({
        code: 'NET_DNS_003',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.ERROR,
        userMessage: `Cannot resolve hostname`,
        technicalMessage: `DNS resolution failed for ${request.url}`,
        context: { url: request.url },
        recoverable: true,
        retryable: true,
        recoveryActions: [
          { label: 'Check Internet', action: 'check_internet', primary: true },
          { label: 'Check Hostname', action: 'check_hostname', primary: false },
        ],
      });
    }

    // Generic network error
    throw new RocketAPIError({
      code: 'NET_UNEXPECTED_010',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.ERROR,
      userMessage: 'Network error occurred',
      technicalMessage: error.message,
      context: { url: request.url, error: error.toString() },
      recoverable: true,
      retryable: true,
      recoveryActions: [
        { label: 'Retry', action: 'retry', primary: true },
      ],
    });
  }
}
```

### File System Errors

```typescript
async function readBruFile(filepath: string): Promise<BruFile> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return parseBruFile(content);

  } catch (error) {
    // File not found
    if (error.code === 'ENOENT') {
      throw new RocketAPIError({
        code: 'FILE_NOT_FOUND_001',
        category: ErrorCategory.FILE_SYSTEM,
        severity: ErrorSeverity.ERROR,
        userMessage: `File not found: ${filepath}`,
        technicalMessage: `ENOENT: ${filepath}`,
        context: { filepath },
        recoverable: true,
        retryable: false,
        recoveryActions: [
          { label: 'Check Path', action: 'check_path', primary: true },
          { label: 'Create File', action: 'create_file', primary: false },
        ],
      });
    }

    // Permission denied
    if (error.code === 'EACCES') {
      throw new RocketAPIError({
        code: 'FILE_PERMISSION_005',
        category: ErrorCategory.FILE_SYSTEM,
        severity: ErrorSeverity.ERROR,
        userMessage: `Access denied: ${filepath}`,
        technicalMessage: `EACCES: ${filepath}`,
        context: { filepath },
        recoverable: true,
        retryable: false,
        recoveryActions: [
          { label: 'Grant Permissions', action: 'grant_permissions', primary: true },
        ],
      });
    }

    throw error;
  }
}
```

### Parsing Errors

```typescript
function parseBruFile(content: string): BruFile {
  try {
    // Validate UTF-8
    if (!isValidUTF8(content)) {
      throw new RocketAPIError({
        code: 'PARSE_ENCODING_008',
        category: ErrorCategory.PARSING,
        severity: ErrorSeverity.ERROR,
        userMessage: 'File encoding error: expected UTF-8',
        technicalMessage: 'Invalid UTF-8 byte sequence detected',
        recoverable: true,
        retryable: false,
        recoveryActions: [
          { label: 'Convert to UTF-8', action: 'convert_encoding', primary: true },
        ],
      });
    }

    // Parse sections
    const sections = extractSections(content);

    // Validate meta section exists
    if (!sections.meta) {
      throw new RocketAPIError({
        code: 'PARSE_MISSING_SECTION_002',
        category: ErrorCategory.PARSING,
        severity: ErrorSeverity.ERROR,
        userMessage: "Required section 'meta' missing",
        technicalMessage: 'Missing required meta section in .bru file',
        context: { sections: Object.keys(sections) },
        recoverable: true,
        retryable: false,
        recoveryActions: [
          { label: 'Add Meta Section', action: 'add_meta', primary: true },
        ],
      });
    }

    // Validate JSON body if present
    if (sections.body?.type === 'json') {
      try {
        JSON.parse(sections.body.data);
      } catch (jsonError) {
        throw new RocketAPIError({
          code: 'PARSE_JSON_005',
          category: ErrorCategory.PARSING,
          severity: ErrorSeverity.ERROR,
          userMessage: `Invalid JSON in body: ${jsonError.message}`,
          technicalMessage: jsonError.toString(),
          context: { body: sections.body.data },
          recoverable: true,
          retryable: false,
          recoveryActions: [
            { label: 'Fix JSON Syntax', action: 'fix_json', primary: true },
          ],
        });
      }
    }

    return buildBruFile(sections);

  } catch (error) {
    if (error instanceof RocketAPIError) {
      throw error;
    }

    // Unexpected parsing error
    throw new RocketAPIError({
      code: 'PARSE_UNEXPECTED_010',
      category: ErrorCategory.PARSING,
      severity: ErrorSeverity.ERROR,
      userMessage: 'Error parsing .bru file',
      technicalMessage: error.message,
      recoverable: false,
      retryable: false,
      recoveryActions: [],
    });
  }
}
```

### Validation Errors

```typescript
function validateRequest(request: Request): ValidationResult {
  const errors: RocketAPIError[] = [];

  // Validate URL
  if (!isValidURL(request.url)) {
    errors.push(new RocketAPIError({
      code: 'VAL_URL_001',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      userMessage: `Invalid URL: ${request.url}`,
      technicalMessage: 'URL validation failed',
      context: { url: request.url },
      recoverable: true,
      retryable: false,
      recoveryActions: [
        { label: 'Correct URL Format', action: 'fix_url', primary: true },
      ],
    }));
  }

  // Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(request.method)) {
    errors.push(new RocketAPIError({
      code: 'VAL_METHOD_002',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      userMessage: `Invalid HTTP method: ${request.method}`,
      technicalMessage: `Method must be one of: ${validMethods.join(', ')}`,
      context: { method: request.method, validMethods },
      recoverable: true,
      retryable: false,
      recoveryActions: [
        { label: 'Use Valid Method', action: 'fix_method', primary: true },
      ],
    }));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Retry Strategy

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number
  initialDelay: number      // ms
  maxDelay: number          // ms
  backoffMultiplier: number
  retryableErrors: ErrorCode[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'NET_TIMEOUT_001',
    'NET_DNS_003',
    'NET_UNREACHABLE_007',
    'NET_5XX_009',
  ],
};
```

### Retry Implementation

```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: RocketAPIError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();

    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!error.retryable || !config.retryableErrors.includes(error.code)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}
```

## User-Facing Error Messages

### Message Templates

```typescript
const ERROR_MESSAGES = {
  // Network errors
  'NET_TIMEOUT_001': (context) =>
    `Request timed out after ${context.timeout}ms. The server took too long to respond.`,

  'NET_REFUSED_002': (context) =>
    `Could not connect to ${context.url}. Make sure the server is running and the URL is correct.`,

  'NET_DNS_003': (context) =>
    `Cannot find server "${context.hostname}". Check your internet connection and verify the hostname is correct.`,

  // File errors
  'FILE_NOT_FOUND_001': (context) =>
    `File not found: ${context.path}. The file may have been moved or deleted.`,

  'FILE_PERMISSION_005': (context) =>
    `Access denied to ${context.path}. Check file permissions.`,

  // Parsing errors
  'PARSE_SYNTAX_001': (context) =>
    `Syntax error in ${context.file} at line ${context.line}, column ${context.column}: ${context.message}`,

  'PARSE_JSON_005': (context) =>
    `Invalid JSON in request body: ${context.error}. Check your JSON syntax.`,
};
```

### Toast Notifications

```typescript
interface ToastNotification {
  title: string
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  duration: number // ms
  actions?: ToastAction[]
}

interface ToastAction {
  label: string
  onClick: () => void
}

function showErrorToast(error: RocketAPIError) {
  const notification: ToastNotification = {
    title: getErrorTitle(error.category),
    message: error.userMessage,
    type: error.severity === ErrorSeverity.WARNING ? 'warning' : 'error',
    duration: error.severity === ErrorSeverity.FATAL ? 0 : 5000, // Don't auto-dismiss fatal
    actions: error.recoveryActions.map(action => ({
      label: action.label,
      onClick: () => handleRecoveryAction(action.action, error.context),
    })),
  };

  toast.show(notification);
}

function getErrorTitle(category: ErrorCategory): string {
  const titles = {
    [ErrorCategory.NETWORK]: 'Network Error',
    [ErrorCategory.FILE_SYSTEM]: 'File Error',
    [ErrorCategory.PARSING]: 'Parse Error',
    [ErrorCategory.VALIDATION]: 'Validation Error',
    [ErrorCategory.RUNTIME]: 'Application Error',
    [ErrorCategory.SECURITY]: 'Security Error',
  };

  return titles[category];
}
```

## Logging

### Log Structure

```typescript
interface ErrorLog {
  timestamp: string
  errorId: string
  code: string
  category: string
  severity: string
  userMessage: string
  technicalMessage: string
  context: Record<string, any>
  stack?: string
  user?: {
    sessionId: string
    appVersion: string
    platform: string
  }
}
```

### Log Implementation

```typescript
class ErrorLogger {
  private logs: ErrorLog[] = [];

  log(error: RocketAPIError) {
    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      errorId: error.id,
      code: error.code,
      category: error.category,
      severity: error.severity,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      context: error.context,
      stack: error.stack,
      user: {
        sessionId: getSessionId(),
        appVersion: getAppVersion(),
        platform: getPlatform(),
      },
    };

    // Add to in-memory logs
    this.logs.push(logEntry);

    // Persist to file (async)
    this.persistLog(logEntry);

    // Console log for development
    if (isDevelopment()) {
      console.error('[ERROR]', logEntry);
    }
  }

  private async persistLog(log: ErrorLog) {
    const logFile = path.join(getLogsDirectory(), `errors-${getCurrentDate()}.log`);
    await fs.appendFile(logFile, JSON.stringify(log) + '\n');
  }

  getLogs(filter?: Partial<ErrorLog>): ErrorLog[] {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => log[key] === value);
    });
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

## Error Recovery Actions

### Action Handlers

```typescript
const RECOVERY_ACTIONS = {
  retry: async (context) => {
    // Retry the failed operation
    return executeRequest(context.request);
  },

  increase_timeout: async (context) => {
    // Open settings and increase timeout
    openSettings('network.timeout');
  },

  check_url: async (context) => {
    // Highlight URL field for editing
    focusField('request.url');
  },

  check_path: async (context) => {
    // Open file picker
    const newPath = await openFilePicker();
    if (newPath) {
      loadFile(newPath);
    }
  },

  create_file: async (context) => {
    // Create new file with template
    await createFileFromTemplate(context.filepath);
  },

  grant_permissions: async (context) => {
    // Show permission instructions
    showPermissionHelp(context.filepath);
  },

  fix_json: async (context) => {
    // Open JSON validator/formatter
    openJSONValidator(context.body);
  },

  convert_encoding: async (context) => {
    // Convert file to UTF-8
    await convertFileEncoding(context.filepath, 'UTF-8');
  },
};

async function handleRecoveryAction(action: string, context: any) {
  const handler = RECOVERY_ACTIONS[action];
  if (handler) {
    await handler(context);
  }
}
```

## Testing Error Handling

### Error Simulation

```typescript
// For testing, inject errors
class ErrorSimulator {
  private errorMap = new Map<string, RocketAPIError>();

  injectError(operation: string, error: RocketAPIError) {
    this.errorMap.set(operation, error);
  }

  checkAndThrow(operation: string) {
    const error = this.errorMap.get(operation);
    if (error) {
      this.errorMap.delete(operation);
      throw error;
    }
  }
}

// Usage in tests
const simulator = new ErrorSimulator();

simulator.injectError('executeRequest', new RocketAPIError({
  code: 'NET_TIMEOUT_001',
  // ... error details
}));

// This will throw the injected error
await executeRequest(request);
```

### Test Cases

```typescript
describe('Error Handling', () => {
  it('should handle network timeout', async () => {
    const request = createMockRequest();
    simulator.injectError('fetch', timeoutError);

    await expect(executeRequest(request)).rejects.toThrow(RocketAPIError);
    expect(errorLogger.logs).toHaveLength(1);
    expect(errorLogger.logs[0].code).toBe('NET_TIMEOUT_001');
  });

  it('should retry on retryable errors', async () => {
    let attempts = 0;
    const request = createMockRequest();

    // Fail twice, succeed on third
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('ECONNREFUSED');
      }
      return Promise.resolve(new Response());
    });

    await executeWithRetry(() => executeRequest(request));
    expect(attempts).toBe(3);
  });
});
```

## Best Practices

1. **Always throw RocketAPIError** instances, not generic errors
2. **Provide context** - include relevant data for debugging
3. **User-friendly messages** - avoid technical jargon
4. **Recovery actions** - always offer what user can do next
5. **Log everything** - even handled errors
6. **Test error paths** - don't just test happy paths
7. **Consistent error codes** - use the registry
8. **Localization-ready** - structure supports i18n

## Summary

This error handling framework provides:

- ✅ Comprehensive error taxonomy
- ✅ Consistent error structure
- ✅ User-friendly messages
- ✅ Recovery actions
- ✅ Retry logic
- ✅ Detailed logging
- ✅ Testing support

All errors should follow this framework for consistency and maintainability.
