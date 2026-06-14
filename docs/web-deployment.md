# Lime HTML5 Deployment Guide / Lime HTML5 发布指南

This guide covers everything you need to take a Lime HTML5 project from local
development to a production web deployment.  It is organized around the problems
people actually hit — not a parameter reference — so you can jump to the
section that matches the symptom you are seeing.

本指南覆盖从本地开发到正式上线的完整流程，按"常见问题"而非参数表组织，方便按症状定位。

---

### 中文速查 / Quick Chinese Summary

| 你想做的事 | 看第几节 |
|---|---|
| 本地双击 index.html 跑不起来 | [第 4 节](#4-local-development--why-double-click-fails)：`file://` 被浏览器禁止 XHR，必须用 HTTP 服务器 |
| 放到子目录 / CDN 后图片声音加载不到 | [第 5 节](#5-resource-paths--subdirectory-cdn-and-rootpath)：相对路径 + MIME + CORS |
| 手机上第一次进来没声音 | [第 6 节](#6-audio-on-mobile--the-first-play-problem)：浏览器 autoplay 策略，需要用户手势触发 |
| 更新版本后浏览器还是旧缓存 | [第 7 节](#7-cache-busting-and-post-update-refresh)：`cache.version` + JS 文件策略 |
| `lime deploy` 为什么没部署上去 | [第 11 节](#11-relationship-to-other-docs)：deploy 只打 zip，真正发布要自己上传 |
| 两套构建方式怎么选 | [第 1 节](#1-two-build-paths-at-a-glance)：直接模板 vs NPM/Webpack |
| 上线前逐项检查 | [第 9 节](#9-deployment-checklist)：发布 Checklist |

---

## Table of Contents

1. [Two Build Paths at a Glance](#1-two-build-paths-at-a-glance)
2. [Quick Start — Direct Template Build](#2-quick-start--direct-template-build)
3. [NPM / Webpack Build](#3-npm--webpack-build)
4. [Local Development — Why Double-Click Fails](#4-local-development--why-double-click-fails)
5. [Resource Paths — Subdirectory, CDN, and rootPath](#5-resource-paths--subdirectory-cdn-and-rootpath)
6. [Audio on Mobile — The First-Play Problem](#6-audio-on-mobile--the-first-play-problem)
7. [Cache Busting and Post-Update Refresh](#7-cache-busting-and-post-update-refresh)
8. [Common Errors and Troubleshooting Checklist](#8-common-errors-and-troubleshooting-checklist)
9. [Deployment Checklist](#9-deployment-checklist)
10. [Minimal Reference Template](#10-minimal-reference-template)
11. [Relationship to Other Docs](#11-relationship-to-other-docs)

---

## 1. Two Build Paths at a Glance

| Aspect | Direct Template (`lime build html5`) | NPM / Webpack (`lime build html5 -npm`) |
|---|---|---|
| **Entry** | `lime build html5` or `lime test html5` | `lime build html5 -npm` then `npm run build` |
| **Output dir** | `bin/html5/bin/` (flat static site) | `bin/html5/bin/dist/` (webpack output) |
| **JS format** | Single `App.js` wrapped with `lime.embed()` | Webpack bundle, exported as `window.lime` |
| **Minification** | `-final` flag or `-minify` (Closure/Terser/YUI) | `npm run build:prod` (UglifyJS) |
| **Dev server** | `lime run html5` — bundled Node http-server | `npm start` — webpack-dev-server with HMR |
| **Best for** | Simple static hosting, CDN upload, itch.io | Projects with npm dependencies, CI pipelines |

Both paths produce a static site (HTML + JS + asset folders) that can be served
by any HTTP server.  The runtime code is identical — only the build wrapper
differs.

---

## 2. Quick Start — Direct Template Build

This is the path of least resistance.  Run these commands:

```bash
# Create a sample project (skip if you already have one)
lime create HelloWorld
cd HelloWorld

# Build release output
lime build html5

# Build + auto-launch in browser with local dev server
lime test html5
```

### What gets produced

```
bin/html5/bin/
├── index.html              ← the entry page (from templates/html5/template/index.html)
├── MyApplication.js        ← compiled Haxe→JS, wrapped in output.js template
├── favicon.png             ← generated from project icon
├── lib/                    ← linked JS dependencies (howler.min.js, pako.min.js, etc.)
├── assets/                 ← your images, sounds, fonts, text files
│   └── ...
└── manifest/               ← JSON asset manifests (one per library)
    └── default.json
```

Upload this entire directory to any web server and it works.  The directory
structure **must be preserved** — asset paths in the manifest are relative.

### Build variants

```bash
lime build html5            # release (default)
lime build html5 -debug     # debug build (larger JS, with source maps)
lime build html5 -final     # optimized: js-flatten + DCE full + minify
lime build html5 -minify    # release + minify (Closure Compiler by default)
lime build html5 -minify -terser  # release + Terser minifier
```

---

## 3. NPM / Webpack Build

Use this when your project has npm dependencies or you want webpack's module
system and dev-server hot reload.

### Setup (one-time per project)

```bash
lime build html5 -npm       # generates package.json, webpack configs, runs npm install
cd bin/html5/bin
```

The first `-npm` build copies these templates into your output:

| Generated file | Purpose |
|---|---|
| `package.json` | Declares webpack 4, haxe-loader, UglifyJS, webpack-dev-server |
| `webpack.common.js` | Shared config: entry `.hxml`, output as `window.lime` |
| `webpack.dev.js` | Dev: inline source maps, `contentBase: ./dist` |
| `webpack.prod.js` | Prod: UglifyJS, separate source maps, `NODE_ENV=production` |

### Daily workflow

```bash
cd bin/html5/bin

# Development — launches webpack-dev-server, opens browser
npm start              # = npm run start:dev

# Production build
npm run build          # = npm run build:prod

# Preview production build locally
npm run start:prod
```

### Webpack output differences

With NPM mode, the Haxe JS bundle lands in `dist/` inside the bin directory.
Your `index.html` (also in `dist/`) references `./App.js` which webpack has
bundled.  Asset files still live alongside in `dist/assets/` and
`dist/manifest/`.

### Key webpack config detail

`webpack.common.js` sets:

```javascript
output: {
    library: "lime",
    libraryTarget: 'window',
    libraryExport: 'lime'
}
```

This means the compiled Lime API is available as `window.lime` for external
scripts.  If you embed the output in a larger page, use `window.lime.embed()`
to initialize.

---

## 4. Local Development — Why Double-Click Fails

### The symptom

You double-click `bin/html5/bin/index.html` in your file manager.  The page
loads but shows a blank screen, or the console shows errors like:

```
Cross-Origin Request Blocked
Failed to load 'file:///...manifest/default.json'
Cannot read properties of undefined (reading 'fromManifest')
```

### Why it happens

Lime's HTML5 runtime loads assets via `XMLHttpRequest` (XHR) and `fetch()`.
Modern browsers **block XHR from `file://` protocol** for security reasons.
This is not a Lime bug — it is a browser security policy.

Additionally, Web Audio API (used by HowlerJS for sound) requires a "secure
context" which `file://` does not qualify for on some browsers.

### The fix: always use an HTTP server

**Built-in dev server** (recommended):

```bash
lime test html5
# or equivalently:
lime run html5
```

This launches a bundled Node.js http-server with:
- `-c-1` — caching **disabled** (prevents stale asset issues during dev)
- `--cors` — CORS headers enabled
- Auto-opens browser (add `-nolaunch` flag to skip)

You can specify a port:

```bash
lime test html5 -port 8080
```

**Other local servers** (any of these work):

```bash
# Python 3
python -m http.server 8080

# Node npx
npx http-server bin/html5/bin -c-1 --cors

# PHP
php -S localhost:8080 -t bin/html5/bin
```

### Can I ever use file://?

Only if your project has **zero assets** loaded at runtime (all embedded via
`-resource` or inline).  For any real project, always use HTTP.

---

## 5. Resource Paths — Subdirectory, CDN, and rootPath

### How asset paths work

Lime generates a JSON manifest file (`manifest/default.json`) that maps asset
IDs to relative file paths.  At runtime, `AssetLibrary.fromManifest()` reads
the manifest and resolves each path as:

```
finalURL = rootPath + "/" + asset.path
```

The `rootPath` is derived from the manifest's own URL.  If the manifest is at:

```
https://cdn.example.com/games/mygame/manifest/default.json
```

Then `rootPath` becomes:

```
https://cdn.example.com/games/mygame/manifest
```

And an asset with `path: "../assets/image.png"` resolves to:

```
https://cdn.example.com/games/mygame/assets/image.png
```

### Deploying to a subdirectory

If you deploy your build output to `https://example.com/mygame/`, just upload
the entire `bin/html5/bin/` contents into the `/mygame/` directory.  Because
all paths in the template are relative (`./App.js`, `./lib/howler.min.js`),
this works without any configuration change.

**Key requirement**: your web server must serve `index.html` as the default
document for that directory (standard for Apache, Nginx, IIS, most static
hosts).

### Deploying to a CDN

Upload the entire output directory to your CDN.  Make sure:

1. **MIME types** are configured:
   - `.js` → `application/javascript`
   - `.json` → `application/json`
   - `.wasm` → `application/wasm` (for WebAssembly builds)
   - `.mp3` → `audio/mpeg`
   - `.ogg` → `audio/ogg`
   - `.png` → `image/png`

2. **CORS headers** are set if loading from a different origin than your HTML
   page:
   ```
   Access-Control-Allow-Origin: *
   ```
   Without this, XHR requests for manifests and assets will be blocked.

3. **Cache headers** — see [Section 7](#7-cache-busting-and-post-update-refresh).

### Custom rootPath in code

If you need to load assets from a different origin (e.g., assets on CDN, page
on main domain), pass `rootPath` explicitly:

```haxe
// Load manifest from CDN
var manifest = AssetManifest.fromFile(
    "https://cdn.example.com/assets/manifest/default.json",
    "https://cdn.example.com/assets"  // explicit rootPath
);
Assets.loadLibrary(manifest).onComplete(function(library) {
    // library assets are now available
});
```

### project.xml path configuration

```xml
<!-- Change the output directory (default: "html5") -->
<config:html5 output-directory="web" />

<!-- Change where JS dependencies are copied (default: "lib") -->
<config:html5 dependency-path="vendor" />
```

---

## 6. Audio on Mobile — The First-Play Problem

### The symptom

Audio works on desktop browsers but is silent on iOS Safari and Android Chrome
when the page first loads.  Sound only starts after the user taps the screen.

### Why it happens

Mobile browsers (and increasingly desktop browsers) enforce an **autoplay
policy**: the Web Audio API context starts in a "suspended" state and can only
be resumed inside a user-gesture event handler (touchstart, click, keydown).

Lime uses [HowlerJS](https://howlerjs.com/) as its HTML5 audio backend
(auto-enabled for all `html5` targets via `include.xml`).  HowlerJS handles
most of the unlock logic internally, but it still requires **at least one user
interaction** before any sound can play.

### Recommended patterns

**Pattern A: Start audio on first touch/click (simplest)**

In your Haxe code's entry point:

```haxe
import lime.media.AudioSource;

class Main {
    static function main() {
        // Show a "Tap to Start" overlay
        // When user taps:
        var onTap = function(_) {
            // Now safe to play audio
            var source = AudioSource.fromFile("assets/sfx/intro.ogg");
            source.play();
        };
        lime.ui.Window.create().onMouseDown.add(onTap);
    }
}
```

**Pattern B: Unlock audio context early with a silent buffer**

```haxe
// In your init, attach a one-time listener:
js.Browser.window.addEventListener("touchstart", function(_) {
    // HowlerJS auto-unlocks on first user gesture
    // This just ensures it happens as early as possible
}, { once: true });
```

**Pattern C: Use a loading/splash screen**

Most games already have a loading screen.  Make the "Loading complete" button
a real click/touch event.  Audio unlocked during that interaction will work
for the rest of the session.

### What NOT to do

- Do NOT try to play audio in the constructor or first frame without a user
  gesture — it will silently fail.
- Do NOT use `<audio autoplay>` — it will be blocked.
- Do NOT assume `Howler.usingWebAudio` means audio is unlocked — the context
  may still be suspended.

### HowlerJS compile flags

```xml
<!-- Disable HowlerJS entirely (fall back to HTML5 Audio element) -->
<undefine name="howlerjs" if="html5" />

<!-- Force HTML5 Audio element instead of Web Audio -->
<define name="force_html5_audio" if="html5" />
```

> **Note**: `<audio>` elements have their own autoplay restrictions on mobile.
> Switching away from HowlerJS does not solve the first-play problem — it just
> changes which API is used.

---

## 7. Cache Busting and Post-Update Refresh

### The symptom

You upload a new version of your game.  Returning visitors see the old version
— old JS, old assets, old everything.  Only a hard refresh (Ctrl+Shift+R)
fixes it.

### How Lime's built-in cache busting works

Lime has a compile-time asset version system in `lime.utils.AssetCache`:

```haxe
// AssetCache.hx — version is set at compile time
public var version:Int;

// In Assets.hx — appended to every asset URL
private static function __cacheBreak(path:String):String {
    if (cache.version > 0) {
        path += (path.indexOf("?") > -1 ? "&" : "?") + cache.version;
    }
    return path;
}
```

By default, `version` is a **random integer generated at each Haxe compile**
(`AssetsMacro.cacheVersion()` returns `Std.int(Math.random() * 1000000)`).

This means every `lime build html5` produces a different version number, and
all asset URLs get `?123456` appended, busting the browser cache.

### Custom cache version

To use a specific version (e.g., from CI build number):

```xml
<!-- In project.xml -->
<define name="lime_assets_version" value="42" />
```

Or disable automatic cache busting:

```xml
<define name="lime_disable_assets_version" />
```

> **Important**: The cache-bust version applies to **asset URLs only** (images,
> sounds, fonts, manifests).  It does NOT cover your main `.js` file.

### Busting the JS cache

For the compiled JavaScript, use one of these approaches:

**Option A: Rename the output file per build**

```xml
<!-- In project.xml, use a build-timestamp in the filename -->
<app file="MyApp_${build_number}" />
```

**Option B: Server-side cache headers (recommended)**

Configure your web server to use short or no cache for `.js` and `.json`
files:

```nginx
# Nginx example
location ~* \.(js|json)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Allow longer cache for static assets (images, audio)
location ~* \.(png|jpg|gif|mp3|ogg|wav|woff|ttf)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

```apache
# Apache .htaccess example
<FilesMatch "\.(js|json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

**Option C: CDN query string**

Most CDNs (CloudFront, Cloudflare, Fastly) respect query strings as cache
keys.  Since Lime already appends `?version` to asset URLs, you just need to
handle the `.js` file.  Reference it with a version query in your HTML:

```html
<script src="./MyApplication.js?v=1.2.3"></script>
```

### Service Worker considerations

Lime does not ship a service worker.  If you add one (e.g., for offline PWA
support), you must implement your own update mechanism:

```javascript
// In your service worker registration
navigator.serviceWorker.register('/sw.js').then(function(reg) {
    reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'activated') {
                // Notify user to refresh
                showUpdateBanner();
            }
        });
    });
});
```

---

## 8. Common Errors and Troubleshooting Checklist

### Blank white screen

| Check | How |
|---|---|
| Served over HTTP, not `file://`? | Check URL bar — must be `http://` or `https://` |
| JS file loaded? | DevTools → Network tab → look for 404 on `.js` file |
| JS console errors? | DevTools → Console tab — first error is usually the root cause |
| `lime.embed()` called? | View page source — check for `lime.embed("AppFile", ...)` |
| Correct `<div>` ID? | The embed call's second arg must match a `<div id="...">` |

### Assets not loading (404 or CORS errors)

| Check | How |
|---|---|
| Directory structure intact? | `manifest/`, `assets/`, `lib/` must all be present |
| Manifest JSON valid? | Open `manifest/default.json` directly in browser |
| `rootPath` correct? | Inspect manifest URL in Network tab — path should resolve |
| CORS headers set? | Check response headers for `Access-Control-Allow-Origin` |
| MIME types correct? | Server must serve `.json` as `application/json` |
| No path rewriting? | Some CDNs/reverse proxies strip or rewrite URL paths |

### Audio silent

| Check | How |
|---|---|
| User interacted first? | Mobile requires tap/click before audio can play |
| HowlerJS loaded? | Check `typeof Howl` in console — should be `"function"` |
| Audio file accessible? | Try loading the audio file URL directly in browser |
| Correct audio format? | Browser support varies: try `.ogg`, `.mp3`, `.m4a` |
| Not muted? | Check `Howler.volume()` and per-sound volume |
| `force_html5_audio`? | This define switches to `<audio>` — still needs user gesture |

### Old version after update

| Check | How |
|---|---|
| Cache-bust version active? | Inspect asset URLs in Network tab — should have `?NNN` suffix |
| JS file cache-busted? | Main `.js` needs separate strategy (see Section 7) |
| CDN cache purged? | If using CDN, invalidate/purge after deploy |
| Service worker? | Check `chrome://serviceworker-internals/` — old SW may cache |
| Browser hard refresh? | Ctrl+Shift+R / Cmd+Shift+R to verify it's a cache issue |

### Build errors

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module 'haxe-loader'` | npm dependencies missing | Run `npm install` in the bin directory |
| `haxe not found` | Haxe not in PATH | Install Haxe or add to PATH |
| `webify` fails on font | Webfont generation binary missing | Check `templates/bin/webify-*` exists for your OS |
| Minification fails | Incompatible JS syntax | Try `-terser` instead of default Closure Compiler |
| `port 3000 in use` | Dev server port conflict | Use `-port 8080` to specify alternate port |

### WebAssembly-specific issues

| Error | Cause | Fix |
|---|---|---|
| `wasm streaming compile failed` | Server missing `application/wasm` MIME type | Configure MIME type on server |
| `RangeError: Maximum call stack` | Emscripten stack too small | Increase `-s TOTAL_MEMORY` in build flags |
| Canvas not sizing | Container has 0 dimensions | Set explicit CSS width/height on `#content` |

---

## 9. Deployment Checklist

Use this as a pre-flight check before going live:

```
BUILD
□ Built with -final for optimized output
□ Tested in browser (not just compiled)
□ No console errors on load
□ All assets load correctly (check Network tab for 404s)
□ Audio plays after user interaction

HOSTING
□ Served over HTTP/HTTPS (not file://)
□ MIME types configured (.js, .json, .wasm, audio formats)
□ CORS headers set if cross-origin
□ Default document set to index.html (or explicit URL)
□ Directory structure preserved from build output

CACHE
□ Cache-Control headers: short/no-cache for .js/.json
□ Cache-Control headers: longer for images/audio
□ CDN cache invalidated after deploy (if applicable)
□ Cache-bust version active in asset URLs

MOBILE
□ Tested on real device (not just desktop responsive mode)
□ "Tap to start" or equivalent for audio unlock
□ Viewport meta tag present (auto-generated by template)
□ Touch interactions working (touchmove default-prevented by template)
```

---

## 10. Minimal Reference Template

Below is an annotated minimal `index.html` showing exactly what Lime needs to
run.  The build system generates this from `templates/html5/template/index.html`,
but understanding the parts helps when customizing.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>My App</title>

    <!-- Viewport: prevents zoom on mobile. Auto-adjusted for high-DPI. -->
    <meta id="viewport" name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,
                   user-scalable=no" />
    <meta name="mobile-web-app-capable" content="yes">

    <!-- Linked JS dependencies (HowlerJS for audio, pako for compression, etc.)
         These are copied to lib/ at build time. The dependency-path is
         configurable via <config:html5 dependency-path="vendor" /> -->
    <script src="./lib/howler.min.js"></script>
    <script src="./lib/pako.min.js"></script>

    <!-- Main compiled JS. APP_FILE comes from <app file="..." /> in project.xml.
         This file is wrapped by templates/html5/output.js which provides the
         lime.embed() function and AMD/CommonJS compatibility. -->
    <script src="./MyApplication.js"></script>

    <style>
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        /* #content is the mount point for lime.embed().
           Set width/height to 100% for fullscreen, or fixed px for windowed. */
        #content { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <!-- Mount point — the second argument to lime.embed() must match this ID -->
    <div id="content"></div>

    <script>
        // lime.embed(projectName, containerID, width, height)
        // width=0 and height=0 means "fill the container"
        // projectName must match the <app file="..." /> value
        lime.embed("MyApplication", "content", 0, 0);
    </script>
</body>
</html>
```

### output.js wrapper structure

The compiled `.js` file is wrapped by `templates/html5/output.js`:

```javascript
var $lime_init = (function ($hx_exports, $global) {
    "use strict";
    var $hx_script = (function (exports, global) {
        // ... your compiled Haxe code ...
    });

    // In a Web Worker: just run statics, no DOM needed
    if (typeof self !== "undefined" && self.constructor.name.includes("Worker")) {
        $hx_script({}, $global);
    } else {
        // Register the script so lime.embed() can find it
        $hx_exports.lime = $hx_exports.lime || {};
        $hx_exports.lime.$scripts = $hx_exports.lime.$scripts || {};
        $hx_exports.lime.$scripts["MyApplication"] = $hx_script;

        // The embed() function initializes and runs the project
        $hx_exports.lime.embed = function (projectName) { /* ... */ };
    }

    // AMD module support (RequireJS, etc.)
    if (typeof define === "function" && define.amd) {
        define([], function () { return $hx_exports.lime; });
    }
})(window, window);
```

### How embed() flows at runtime

```
index.html loads MyApplication.js
  → $lime_init IIFE runs
    → registers script under lime.$scripts["MyApplication"]
    → defines lime.embed()

lime.embed("MyApplication", "content", 800, 600) is called
  → looks up lime.$scripts["MyApplication"]
  → executes the compiled Haxe script in that context
  → Haxe Main.main() runs
  → Asset manifests loaded via XHR from manifest/*.json
  → Assets loaded relative to rootPath (derived from manifest URL)
  → Audio initialized via HowlerJS (waits for user gesture on mobile)
  → Render loop starts (Canvas 2D or WebGL)
```

---

## 11. Relationship to Other Docs

| Document | Scope | This guide adds |
|---|---|---|
| `README.md` | Installation, build from source, target list | Specific HTML5 deployment workflow |
| `project/README.md` | C++ native backend builds | Not applicable to HTML5 |
| `tests/runtime/README.md` | Runtime test setup (munit) | Deployment validation (Section 8) |
| `release-checklist.md` | Releasing Lime itself to Haxelib | Releasing **your** Lime app to the web |
| `CONTRIBUTING.md` | Git workflow for Lime contributors | N/A |
| `templates/html5/template/index.html` | Source template with `::macros::` | Section 10 explains the rendered output |
| `templates/html5/npm/package.json` | NPM template | Section 3 explains the workflow |

### Known misleading spots unified here

1. **"lime deploy html5"** — the `deploy` command in `HTML5Platform.hx` only
   zips the output directory and optionally uploads to Google Drive.  It does
   **not** deploy to a web server.  Actual deployment is uploading the zip
   contents to your host (Section 5).

2. **`lime test html5` vs `lime run html5`** — both launch a local dev server,
   but `test` also triggers a build first.  Neither should be confused with
   production deployment.

3. **`-webgl` flag** — enables a WebGL (C++ via Emscripten) path rather than
   the standard Canvas/WebGL Haxe path.  Output structure is the same, but
   build times are much longer and the JS is larger.  Only use if you need
   specific C++ library support.

4. **Asset `embed="true"` vs `embed="false"`** — for HTML5, embedded assets
   are inlined in the JS (as `-resource`).  Non-embedded assets are loaded at
   runtime via HTTP.  The manifest and `rootPath` only matter for non-embedded
   assets.

5. **`force_html5_audio` define** — switches from HowlerJS/Web Audio to the
   HTML5 `<audio>` element.  This does NOT bypass autoplay restrictions.  It
   is only useful if you need `<audio>`-specific features (e.g., streaming
   very long music tracks).

---

*Last updated: see git log for `docs/web-deployment.md`.*
