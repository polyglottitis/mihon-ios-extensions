# Mihon iOS Native Extension Format v1

This document describes the initial extension ABI consumed by the current Mihon iOS native extension runtime.

## Package structure

A package is a ZIP archive, usually using the `.mihonext` extension.

Required root files:

```text
extension.json
<entry JavaScript file>
```

Optional assets such as an icon may also be included.

The app currently enforces package and individual-entry size limits and rejects unsafe archive paths.

## Manifest

`extension.json`:

```json
{
  "formatVersion": 1,
  "id": "org.example.source",
  "name": "Example Source",
  "version": "1.0.0",
  "language": "en",
  "entry": "source.js",
  "description": "Example native source",
  "website": "https://example.org",
  "icon": "icon.png",
  "capabilities": {
    "search": true,
    "popular": true,
    "latest": true
  },
  "permissions": {
    "hosts": [
      "example.org",
      "api.example.org",
      "*.cdn.example.org"
    ]
  }
}
```

### Required fields

- `formatVersion`: currently exactly `1`.
- `id`: stable source identifier containing letters, numbers, `.`, `_` or `-` only.
- `name`: user-visible source name.
- `version`: extension version string.
- `language`: source language code/label.
- `entry`: JavaScript entry file inside the package.

### Optional fields

- `description`
- `website`: HTTP or HTTPS URL.
- `icon`: package-relative path.
- `capabilities`
- `permissions`

### Capabilities

`search` defaults to `true` when omitted.

`popular` and `latest` default to `false` when omitted.

Only advertise a capability that the JavaScript source actually implements.

### Network permissions

Every host requested through the native networking API must be listed in `permissions.hosts`.

Exact host:

```json
"api.example.org"
```

Wildcard subdomain rule:

```json
"*.cdn.example.org"
```

A wildcard rule permits both the base domain and its subdomains.

## JavaScript entry point

The entry file must assign an object to:

```js
globalThis.source
```

Supported operations:

```js
globalThis.source = {
  async search(query, page) {},
  async popular(page) {},
  async latest(page) {},
  async details(manga) {},
  async chapters(manga) {},
  async pages(chapter) {}
};
```

`popular` and `latest` are optional when their capabilities are false.

The current app-side runtime imposes a hard timeout on source operations so a Promise must eventually resolve or reject.

## Host API

The runtime currently exposes `globalThis.mihon`.

### `mihon.request(request)`

```js
const response = await mihon.request({
  url: "https://api.example.org/manga",
  method: "GET",
  headers: {
    "Accept": "application/json"
  },
  body: null
});
```

Response shape:

```js
{
  url: "https://api.example.org/manga",
  status: 200,
  headers: {},
  body: "raw response body"
}
```

### `mihon.requestJSON(request)`

Convenience wrapper that parses the response body as JSON:

```js
const response = await mihon.requestJSON({
  url: "https://api.example.org/manga"
});

const value = response.json;
```

### `mihon.resolveURL(base, path)`

```js
const absolute = mihon.resolveURL(
  "https://example.org/title/1",
  "/images/cover.jpg"
);
```

### `mihon.log(...values)`

Development logging. Output is only useful when verbose app logging is enabled.

## Manga listing result

`search`, `popular` and `latest` return:

```js
{
  manga: [
    {
      id: "123",
      title: "Example Manga",
      url: "https://example.org/title/123",
      thumbnailURL: "https://cdn.example.org/123.jpg",
      author: "Author",
      artist: "Artist",
      summary: "Description",
      genres: ["Action", "Adventure"],
      status: "ongoing"
    }
  ],
  hasNextPage: false
}
```

Required manga properties:

- `id`
- `title`
- `url`

Other properties may be `null`/omitted where appropriate.

## Details

`details(manga)` receives the manga object selected by the app and returns a manga object in the same shape, usually with richer metadata.

## Chapters

`chapters(manga)` returns:

```js
[
  {
    id: "chapter-12",
    title: "Chapter 12",
    url: "https://example.org/chapter/12",
    number: 12,
    scanlator: "Group",
    uploadedAt: "2026-08-17T10:00:00Z"
  }
]
```

Required chapter properties:

- `id`
- `title`
- `url`

`uploadedAt`, when supplied, should be ISO-8601.

## Pages

`pages(chapter)` returns:

```js
[
  {
    url: "https://cdn.example.org/pages/001.jpg",
    referer: "https://example.org/chapter/12"
  }
]
```

Each page URL must be HTTP/HTTPS and its host must be allowed by the extension manifest.

## Current v1 limitations

The current runtime is intentionally small. It does not currently provide:

- DOM/CSS selector parsing
- WebView/browser execution
- arbitrary filesystem access
- arbitrary native Swift execution
- a shared extension repository/catalogue protocol

For now, API/JSON-backed sources are the best fit. HTML parsing should be added as an explicit future host API instead of exposing unrestricted browser execution.
