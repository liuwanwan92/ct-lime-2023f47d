# HTML5 Deployment Self-Test

A standalone HTML page that validates your Lime HTML5 build output is ready
for deployment.

## Usage

1. Build your Lime project for HTML5:
   ```bash
   lime build html5
   ```

2. Copy `self-test.html` into the build output directory:
   ```bash
   cp tests/html5-deploy/self-test.html bin/html5/bin/
   ```

3. Serve the build output with an HTTP server:
   ```bash
   lime run html5
   # or: npx http-server bin/html5/bin -c-1 --cors
   ```

4. Open the self-test page in your browser:
   ```
   http://localhost:3000/self-test.html
   ```

## What it checks

| Section | Tests |
|---|---|
| **1. Server & Protocol** | HTTP vs file://, localhost vs remote |
| **2. XHR & Asset Loading** | XHR availability, manifest JSON loading, MIME types |
| **3. Audio Capabilities** | Web Audio API, HowlerJS, format support, autoplay policy |
| **4. Cache Busting** | Cache-Control headers, Lime's cache.version mechanism |
| **5. Mobile Readiness** | Viewport meta, device pixel ratio, touch support |
| **6. Build Output** | Directory structure: manifest/, lib/, favicon |

## Related documentation

- [Web Deployment Guide](../../docs/web-deployment.md)
- [Runtime Tests](../runtime/README.md)
- [Unit Tests](../unit/project.xml)
