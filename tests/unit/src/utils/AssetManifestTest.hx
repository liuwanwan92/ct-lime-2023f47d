package utils;

import lime.utils.AssetManifest;
import utest.Assert;
import utest.Test;

class AssetManifestTest extends Test {
	public function new() {
		super();
	}

	public function testParseBasicFields():Void {
		var json = '{"name":"test","libraryType":"lime.utils.AssetLibrary"}';
		var manifest = AssetManifest.parse(json);
		Assert.notNull(manifest);
		Assert.equals("test", manifest.name);
		Assert.equals("lime.utils.AssetLibrary", manifest.libraryType);
	}

	public function testRootPathFromManifestOnly():Void {
		// rootPath comes from the manifest itself, no external prefix passed
		var json = '{"name":"test","rootPath":"lib"}';
		var manifest = AssetManifest.parse(json);
		Assert.equals("lib", manifest.rootPath);
	}

	public function testRootPathFromArgumentOnly():Void {
		// manifest has no rootPath, the external prefix is applied
		var json = '{"name":"test"}';
		var manifest = AssetManifest.parse(json, "cdn");
		Assert.equals("cdn", manifest.rootPath);
	}

	public function testRootPathCombined():Void {
		// external prefix is prepended to the manifest's own rootPath
		var json = '{"name":"test","rootPath":"lib"}';
		var manifest = AssetManifest.parse(json, "cdn");
		Assert.equals("cdn/lib", manifest.rootPath);
	}

	public function testRootPathEmptyManifestWithArgument():Void {
		// an empty rootPath in the manifest is treated the same as none
		var json = '{"name":"test","rootPath":""}';
		var manifest = AssetManifest.parse(json, "cdn");
		Assert.equals("cdn", manifest.rootPath);
	}

	public function testRootPathNoneStaysNull():Void {
		var json = '{"name":"test"}';
		var manifest = AssetManifest.parse(json);
		Assert.isNull(manifest.rootPath);
	}

	public function testSerializeRoundTrip():Void {
		var json = '{"name":"test","libraryType":"lime.utils.AssetLibrary","rootPath":"lib"}';
		var manifest = AssetManifest.parse(json);
		var restored = AssetManifest.parse(manifest.serialize());
		Assert.notNull(restored);
		Assert.equals("test", restored.name);
		Assert.equals("lime.utils.AssetLibrary", restored.libraryType);
		Assert.equals("lib", restored.rootPath);
	}
}
