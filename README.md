# Mihon iOS Native Extensions

This repository contains development and test extensions for the native extension ABI implemented by `polyglottitis/mihon-ios`.

The app itself remains source-neutral. Extensions live here as separate packages and are installed by the user.

## Layout

```text
docs/
  extension-format-v1.md

templates/
  basic/
    extension.json
    source.js

sources/
  <extension>/
    extension.json
    source.js

builds/
  <extension>-<version>.mihonext
```

## Current test extensions

### TCB Scans

Source: `sources/tcb-scans/`

Build: `builds/tcb-scans-0.1.0.mihonext`

The first version is intentionally search-only at the catalogue level. It indexes the site's `/projects` page, then resolves manga details, chapters, and reader pages from the corresponding HTML pages.

## Building an extension

A `.mihonext` package is a ZIP archive whose root contains at least:

```text
extension.json
source.js
```

The manifest declares the extension id, version, capabilities, and explicit network host permissions. The JavaScript entry file assigns an implementation to `globalThis.source`.

See `docs/extension-format-v1.md` for the full v1 contract.

## Scope

This repository is for extension development and testing. It is not a bundled/default source catalogue for the iOS app.
