# Mihon iOS Extensions

Companion repository for developing and testing native extensions for `polyglottitis/mihon-ios`.

This repository is intentionally separate from the app. The app ships without a source catalogue; extensions are user-installed packages that implement the Mihon iOS native extension ABI.

## Layout

```text
sources/                 Extension source projects
builds/                  Built `.mihonext` packages for testing
templates/basic/         Minimal v1 extension template
docs/extension-format-v1.md
```

## Native extension package

A v1 package is a ZIP archive, conventionally named `.mihonext`, containing at minimum:

```text
extension.json
source.js
```

The manifest declares the source identity, version, capabilities, entry file and the network hosts the extension is allowed to access. The JavaScript entry exposes one `globalThis.source` object implementing the source operations.

See `docs/extension-format-v1.md` for the current contract.

## Development workflow

1. Copy `templates/basic` into `sources/<source-id>`.
2. Implement the source against the v1 ABI.
3. Zip the contents of that source directory so `extension.json` is at the archive root.
4. Rename the archive to `<source-id>.mihonext` if desired.
5. Install it from Browse → Install native extension in Mihon iOS.

`builds/` is for disposable test packages while the ABI is being validated. A repository/catalogue format can be added later once multiple independent sources work reliably.
