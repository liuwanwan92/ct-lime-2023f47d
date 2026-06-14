var $lime_init = (function ($hx_exports, $global) { "use strict"; var $hx_script = (function (exports, global) { ::SOURCE_FILE::
});::if false::
/*
	TEMPLATE DOCUMENTATION (this block is stripped from the generated output)
	==========================================================================

	Lime HTML5 Output Wrapper — see docs/web-deployment.md for the full guide.

	This template wraps compiled Haxe JS with the lime.embed() entry point.
	It supports: browser global (window.lime), AMD (RequireJS), CommonJS,
	and Web Workers.

	How it works:
	1. ::SOURCE_FILE:: is replaced with the compiled Haxe JS at build time.
	2. The IIFE registers the script under lime.$scripts["::APP_FILE::"].
	3. lime.embed(projectName, containerId, width, height) is called from
	   index.html to initialize the application.
	4. In Web Worker context, only statics are initialized (no DOM).
	5. AMD module support is provided for RequireJS compatibility.

	Deployment notes:
	- This file is loaded via <script src="./::APP_FILE::.js"> in index.html.
	- Browser cache: this file is NOT automatically cache-busted. Configure
	  server Cache-Control headers or add a ?version query string.
	- Embedded libraries (HowlerJS, pako, etc.) are appended at the bottom.

	Don't insert or remove any line breaks in the code above this line!

	::SOURCE_FILE:: must start on the first line.

	Breakpoints in debug builds won't work if this file's line numbers don't
	match the .js.map file's expected line numbers exactly.

	Additionally, the }); after ::SOURCE_FILE:: must appear on the next line
	to avoid it getting ignored in a // comment at the end of ::SOURCE_FILE::.
*/
::end::
	if (typeof self !== "undefined" && self.constructor.name.includes("Worker")) {
		// Web Worker context: no DOM, just initialize Haxe statics.
		$hx_script({}, $global);
	} else {
		// Browser context: register the compiled script under lime.$scripts
		// so lime.embed("ProjectName") can find and execute it.
		$hx_exports.lime = $hx_exports.lime || {};
		$hx_exports.lime.$scripts = $hx_exports.lime.$scripts || {};
		$hx_exports.lime.$scripts["::APP_FILE::"] = $hx_script;

		// lime.embed(projectName, containerId, width, height)
		// Called from index.html to initialize the application.
		// projectName must match <app file="..." /> in project.xml.
		$hx_exports.lime.embed = function (projectName) {
			var exports = {};
			var script = $hx_exports.lime.$scripts[projectName];
			if (!script) throw Error("Cannot find project name \"" + projectName + "\"");
			script(exports, $global);
			for (var key in exports) $hx_exports[key] = $hx_exports[key] || exports[key];
			var lime = exports.lime || window.lime;
			if (lime && lime.embed && this !== lime.embed) lime.embed.apply(lime, arguments);
			return exports;
		};
	}

	if (typeof define === "function" && define.amd) {
		define([], function () { return $hx_exports.lime; });
		define.__amd = define.amd;
		define.amd = null;
	}
})

$lime_init(typeof exports !== "undefined" ? exports : typeof define === "function" && define.amd ? {} : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this,
typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : this);

// Embedded dependencies (HowlerJS, pako, etc.) are injected here at build time.
// See include.xml: <dependency path="dependencies/howler.min.js" if="html5 howlerjs" embed="true" />
::if embeddedLibraries::::foreach embeddedLibraries::
::__current__::::end::::end::

if (typeof define === "function" && define.__amd) {
	define.amd = define.__amd;
	delete define.__amd;
}
