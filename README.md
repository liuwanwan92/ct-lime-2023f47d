[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE.md) [![Haxelib Version](https://img.shields.io/github/tag/openfl/lime.svg?style=flat&label=haxelib)](http://lib.haxe.org/p/lime) [![Build Status](https://img.shields.io/github/actions/workflow/status/openfl/lime/main.yml?branch=develop)](https://github.com/openfl/lime/actions) [![Community](https://img.shields.io/discourse/posts?color=24afc4&server=https%3A%2F%2Fcommunity.openfl.org&label=community)](https://community.openfl.org/c/lime/19) [![Discord Server](https://img.shields.io/discord/415681294446493696.svg?color=7289da)](https://discordapp.com/invite/tDgq8EE)

Lime
====

Lime is a flexible, lightweight layer for Haxe cross-platform developers.

Lime supports native, Flash and HTML5 targets with unified support for:

 * Windowing
 * Input
 * Events
 * Audio
 * Render contexts
 * Network access
 * Assets

Lime does not include a renderer, but exposes the current context:

 * Cairo
 * Canvas
 * DOM
 * Flash
 * GL
 * Vulkan

The GL context is based upon the WebGL standard, implemented for both OpenGL and OpenGL ES as needed.
Native Vulkan support exposes an explicit Vulkan API layer for renderer backends, including native window/swapchain integration and resource/command primitives.
Native Vulkan support is included in standard Windows and Linux C++ Lime builds, including the matching Haxe API define. Apple targets still require an explicit Vulkan-enabled build and MoltenVK packaging.
To request a Vulkan window, use the standard `RenderContextType.VULKAN` context selection or set `<window renderer="vulkan" />` in project XML.
The in-repo `tests/vulkan-smoke` project is used as the current Vulkan CI smoke app.

Lime provides a unified audio API, but also provides access to OpenAL for advanced audio on native targets.


License
=======

Lime is free, open-source software under the [MIT license](LICENSE.md).


Installation
============

First, install the latest version of [Haxe](http://www.haxe.org/download).

Then, install Lime from Haxelib and run Lime's setup command.

    haxelib install lime
    haxelib run lime setup


Development Builds
==================

When there are changes, Lime is built nightly. Builds are available for download [here](https://github.com/openfl/lime/actions?query=branch%3Adevelop+is%3Asuccess).

To install a development build, use the "haxelib local" command:

    haxelib local lime-haxelib.zip


Building from Source
====================

1. Clone the Lime repository, as well as the submodules:

        haxelib git lime https://github.com/openfl/lime

2. Install required dependencies:

        haxelib install format
        haxelib install hxp

3. Copy the ndll directory from the latest [Haxelib release](https://lib.haxe.org/p/lime/), or see [project/README.md](project/README.md) for details about building native binaries.

4. After any changes to the [tools](tools) or [lime/tools](src/lime/tools) directories, rebuild from source:

        lime rebuild tools

5. To switch away from a source build:

        haxelib set lime [version number]


Sample
======

You can build a sample Lime project with the following commands:

    lime create HelloWorld
    cd HelloWorld
    lime test neko

You can also list other projects that are available using "lime create".


Targets
=======

Lime currently supports the following targets:

    lime test windows
    lime test mac
    lime test linux
    lime test android
    lime test ios
    lime test html5
    lime test flash
    lime test air
    lime test neko
    lime test hl

Desktop builds are currently designed to be built on the same host OS


HTML5 Deployment
================

Lime HTML5 builds produce a static site (HTML + JS + assets) ready for any
web server.  Two build paths are available:

 * **Direct template** (`lime build html5`): produces `bin/html5/bin/` with
   a self-contained `index.html`, compiled JS, and asset directories.
 * **NPM / Webpack** (`lime build html5 -npm`): produces a webpack bundle
   in `bin/html5/bin/dist/` with HMR dev server support.

Key points when deploying:

 * **Always serve over HTTP** — `file://` protocol blocks XHR asset loading
   and Web Audio on modern browsers.  Use `lime test html5` for local
   development (launches a bundled dev server).
 * **Mobile audio** requires a user gesture (tap/click) before playback
   can begin — plan a "Tap to Start" screen.
 * **Cache busting** is automatic for assets via a compile-time version
   number; configure server headers for the main JS file.

For the full walkthrough — local launch, subdirectory/CDN paths, audio
unlock, cache strategy, common errors, and a deployment checklist — see
[docs/web-deployment.md](docs/web-deployment.md).

A self-test page is also available at
[tests/html5-deploy/self-test.html](tests/html5-deploy/self-test.html) to
validate your build output before going live.


Join the Community
==================

Have a question? Want a new place to hang out?

 * [Forums](https://community.openfl.org/c/lime/19)
 * [Discord](https://discordapp.com/invite/tDgq8EE)
