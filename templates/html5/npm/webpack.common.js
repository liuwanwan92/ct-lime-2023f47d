// Webpack Common Configuration for Lime HTML5
// =============================================
// This config is merged with webpack.dev.js (development) or webpack.prod.js (production).
//
// DEPLOYMENT NOTES (see docs/web-deployment.md for full guide):
// - Entry: Haxe build file (.hxml) compiled via haxe-loader
// - Output: bundled JS exported as window.lime (libraryTarget: 'window')
// - The "dist/" output directory is served by webpack-dev-server in dev mode
// - For production, upload the entire dist/ directory to your web server
// - Asset files are NOT processed by webpack — they are copied by Lime's build
//   system and loaded at runtime via XHR from relative paths

const path = require ('path');

module.exports = {
	// Entry point: Haxe build file selected by DEBUG/FINAL flags
	entry: "./../haxe/::if DEBUG::debug.hxml::else::::if FINAL::final.hxml::else::release.hxml::end::::end::",
	output: {
		path: path.resolve (__dirname, "dist"),
		filename: "::OUTPUT_FILE::",
		library: "lime",
		libraryTarget: 'window',
		libraryExport: 'lime'
	},
	module: {
		rules: [
			{
				test: /\.hxml$/,
				loader: 'haxe-loader',
			}
		]
	}
};