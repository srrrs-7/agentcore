# Security Rules

Security practices based on OWASP Top 10 and defensive coding principles.

## OWASP Top 10 Mitigations

### 1. Injection Prevention
```typescript
// BAD: String concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// GOOD: Prisma parameterized queries
const user = await prisma.user.findUnique({ where: { id: userId } });

// GOOD: Tagged template for raw queries
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

### 2. Broken Authentication
- Use Cognito/OAuth for authentication (never roll your own)
- Implement proper session management
- Enforce strong password policies via Cognito
- Rate limit authentication endpoints

### 3. Sensitive Data Exposure
```typescript
// BAD: Logging sensitive data
logger.info("User login", { password: user.password });

// GOOD: Redact sensitive fields
logger.info("User login", { userId: user.id, email: user.email });

// BAD: Returning sensitive data in API response
return { user: { ...user, password: user.password } };

// GOOD: Explicitly select safe fields
return { user: { id: user.id, email: user.email, name: user.name } };
```

### 4. XML External Entities (XXE)
- Avoid XML parsing; prefer JSON
- If XML is required, disable external entity processing

### 5. Broken Access Control
```typescript
// BAD: No ownership check
const task = await taskService.getById(taskId);

// GOOD: Verify ownership
const task = await taskService.getById(taskId);
if (task.userId !== currentUser.id) {
  throw new ForbiddenError("Access denied");
}
```

### 6. Security Misconfiguration
- Disable debug mode in production
- Remove default credentials
- Keep dependencies updated
- Use security headers (HSTS, CSP, X-Frame-Options)

### 7. Cross-Site Scripting (XSS)
```typescript
// BAD: innerHTML with user input
element.innerHTML = userInput;

// GOOD: textContent for plain text
element.textContent = userInput;

// GOOD: Svelte auto-escapes by default
<p>{userInput}</p>

// Careful: @html bypasses escaping
{@html sanitizedHtml}
```

### 8. Insecure Deserialization
- Never deserialize untrusted data
- Validate input shape with Zod before processing
- Use JSON.parse with try-catch

### 9. Using Components with Known Vulnerabilities
- Run `bun audit` regularly
- Keep dependencies updated
- Use Dependabot/Renovate for automated updates

### 10. Insufficient Logging & Monitoring
- Log authentication events
- Log authorization failures
- Log input validation failures
- Never log sensitive data (passwords, tokens, PII)

## Input Validation

### Validate All External Input
```typescript
import { z } from "zod";

// Define strict schema
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  dueAt: z.string().datetime().optional(),
});

// Validate before processing
const result = createTaskSchema.safeParse(input);
if (!result.success) {
  return responseBadRequest(c, result.error.flatten());
}
```

### Validation Rules
- Validate type, length, format, and range
- Whitelist allowed values (not blacklist)
- Sanitize output, not input
- Return safe error messages (no internal details)

## Authentication & Sessions

### Token Handling
```typescript
// Access tokens: short-lived, in memory or Authorization header
const accessToken = response.headers.get("Authorization");

// Refresh tokens: httpOnly cookies only
// Set via backend, not accessible to JavaScript
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

### Storage Guidelines
| Data | Storage | Reason |
|------|---------|--------|
| Access token | Memory / Auth header | Short-lived, needs JS access |
| Refresh token | httpOnly cookie | Prevents XSS theft |
| User preferences | localStorage | Non-sensitive |
| Sensitive data | Never client-side | Use backend |

## Secrets Management

### Environment Variables
```bash
# .env.example (committed - template only)
DATABASE_URL=postgresql://user:password@localhost:5432/db
BEARER_TOKEN=your-token-here

# .env (never committed - contains real secrets)
DATABASE_URL=postgresql://prod:realpassword@prod-host:5432/proddb
BEARER_TOKEN=real-secret-token
```

### AWS Secrets Manager
```typescript
// Retrieve secrets at runtime, not build time
const secret = await secretsManager.getSecretValue({
  SecretId: process.env.DB_SECRET_ARN,
});
```

### Best Practices
- Never commit secrets to git (use .gitignore)
- Rotate secrets regularly
- Use different secrets per environment
- Audit secret access

## API Security

### CORS Configuration
```typescript
// BAD: Allow all origins
cors({ origin: "*" })

// GOOD: Explicit allowed origins
cors({
  origin: [
    "https://app.example.com",
    process.env.NODE_ENV === "development" && "http://localhost:5173",
  ].filter(Boolean),
  credentials: true,
})
```

### Rate Limiting
```typescript
// Protect against brute force
app.use("/api/auth/*", rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

### Security Headers
```typescript
// Set security headers
app.use(secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
}));
```

## File Upload Security

### Presigned URL Pattern
```typescript
// Generate presigned URL with restrictions
const presignedUrl = await s3.getSignedUrl("putObject", {
  Bucket: process.env.S3_BUCKET,
  Key: `uploads/${userId}/${uuid()}`,
  ContentType: allowedContentType,
  Expires: 300, // 5 minutes
  Conditions: [
    ["content-length-range", 0, 10 * 1024 * 1024], // Max 10MB
  ],
});
```

### Validation Rules
- Validate file type (magic bytes, not just extension)
- Limit file size
- Generate unique filenames (prevent path traversal)
- Scan for malware in production
- Store outside web root

## Checklist

Before deploying:
- [ ] All inputs validated with Zod
- [ ] No secrets in code or logs
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] Dependencies audited
- [ ] Access control verified
- [ ] Error messages don't leak internals
