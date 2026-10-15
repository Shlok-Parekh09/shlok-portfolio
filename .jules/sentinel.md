## 2024-05-18 - Path Traversal & Security Headers in Local Server
**Vulnerability:** The local development server (`scripts/server.mjs`) allowed arbitrary HTTP methods (POST, etc.), lacked basic security headers (X-Frame-Options, X-Content-Type-Options), allowed viewing restricted paths (like `.env`, `\.`), and had insufficient extension restriction mapping resulting in potential info leak or bypassing file restrictions.
**Learning:** Even local development servers can introduce critical learning gaps or actual vulnerabilities if run externally, especially when relying on naive `path.extname()` checks or `String.startsWith()` for root confinement without addressing encoded traversal techniques (`%5c`, `\`, `..`).
**Prevention:** Strictly allowlist HTTP methods (GET, HEAD), deny sensitive extensions/files entirely via regex or strict checks before filesystem mapping, properly implement Content-Type and `nosniff`, and enforce standard range headers for robust and secure media loading.
## 2026-10-15 - Poison Null Byte Prevention
**Vulnerability:** The static file server (`scripts/server.mjs`) would crash with a `TypeError [ERR_INVALID_ARG_VALUE]` if a request URL contained a null byte (`%00`), leading to a Denial of Service (DoS) due to an unhandled exception in Node.js `fs.stat`.
**Learning:** Node.js file system APIs are strictly validated against null bytes. Unsanitized URLs passed to file path handlers can cause application termination.
**Prevention:** Block any requests containing null bytes early in the request lifecycle and return a `400 Bad Request`.
