# App manifest (`signage-app.json`)

Every signage app publishes a machine-readable manifest describing **what it is**
and **how to configure it**. The app is the source of truth for its own settings.
The [app store](https://signage-apps.com) renders its config pages from this file
(instead of hand-written per-app forms) and publishes an index that points at
every app's manifest. Signage players consume the same manifests directly. Do not
re-implement an app's settings form by hand anywhere else — read it from here.

## Where it lives

Serve the manifest from a stable, well-known path on the app's own origin:

```
https://<app>.srly.io/.well-known/signage-app.json
```

Requirements:

- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *` — consumers fetch it cross-origin.
- Reachable by an anonymous client (no auth).

## Shape

```jsonc
{
  "manifestVersion": "1",          // required. Bump only on breaking changes.
  "id": "weather",                 // required. Stable slug, unique in the store.
  "name": "Weather",               // required. Human title.
  "description": "…",              // required. Full sentence(s) for the detail page.
  "summary": "Live local weather for any display.", // optional. One-line card text.

  "vendor": "Screenly",            // optional.
  "tags": ["Weather", "Clock"],    // optional. Free-form categories.

  "icon": "https://…/icon.svg",            // optional. Square, transparent.
  "screenshots": ["https://…/shot.jpg"],   // optional. First is the primary.

  "homepage": "https://weather.srly.io/",                       // optional.
  "source":   "https://github.com/Screenly-Labs/weather-app",   // optional.
  "support":  "https://github.com/Screenly-Labs/weather-app/issues", // optional.

  // How the app paces itself. Optional. There is deliberately no "duration":
  // total time on screen is a playlist decision, not an app property.
  "playback": {
    "pacing": "stepped",     // "fixed" = one static page | "stepped" = self-advances
    "loops": true,           // stepped only: cycles forever vs plays once and stops
    "stepSeconds": 12,       // stepped only: dwell per internal step
    "refreshIntervalS": 3600 // how often it reloads its data
  },

  // JSON Schema (draft 2020-12) describing the configurable settings.
  // Omit entirely if the app takes no settings.
  "settings": { … },

  // How settings serialize into the launch URL. Required.
  "launch": { … }
}
```

## `playback` — pacing, not duration

`playback` describes how the app paces its own content so a player can hand off
sensibly. It deliberately has **no on-screen duration** — how long an asset stays
up is a playlist decision, not an app property.

- `pacing` — `"fixed"` (one static page) or `"stepped"` (the app advances through
  its own content, e.g. the RSS reader rotating stories).
- `loops` — stepped apps only: `true` cycles forever, `false` plays once and stops.
- `stepSeconds` — stepped apps only: the dwell per internal step. Lets a player
  land its hand-off on a step boundary instead of mid-item.
- `refreshIntervalS` — how often the page reloads its data.

**These are defaults.** Anything the user can change is exposed as a `settings`
field instead, and that field is then the single source of truth — give it a
matching `default` and omit it from `playback`. A player reads the effective
value from the setting, falling back to `playback`. So a fixed rotation lives in
`playback.stepSeconds`; a user-adjustable rotation lives in `settings` (e.g. a
`stepSeconds` number field) and drives both the launch URL and the pacing.

**`playback` is optional — omit it entirely when there's nothing to pace.** A
single-shot page like Quotes (a fresh quote on each load, no rotation, no data
refresh) has no pacing to describe, so it leaves `playback` out rather than
asserting `pacing: "fixed"`.

## `settings` — a JSON Schema object

Settings are a typed form. Use standard JSON Schema for structure, types,
defaults, `enum`, and validation (`minimum`, `maxLength`, `pattern`, …). Layer UI
hints on top with `x-*` keywords (which validators ignore):

| keyword         | meaning |
|-----------------|---------|
| `x-widget`      | Which control to render. See vocabulary below. Inferred from `type`/`enum` if absent. |
| `x-enumLabels`  | Array of human labels parallel to `enum` (same length/order). |
| `x-format`      | For array/object items: a template composing sub-fields into one string token, e.g. `"{zone}|{label}"`. An empty interpolated field drops itself **and its adjacent separator**, so a blank `label` yields just `zone`. |
| `x-group`       | Optional label to visually group fields. |

### `x-widget` vocabulary

| value          | applies to        | notes |
|----------------|-------------------|-------|
| `text`         | `string`          | default for free-text strings |
| `select`       | `string` + `enum` | default when `enum` present |
| `toggle`       | `boolean`         | |
| `number`       | `number`/`integer`| |
| `url`          | `string`          | validated as a URL |
| `location-map` | `object` `{lat,lng}` | draggable map; bind it to a single object property so the pair stays grouped |
| `timezone`     | `string`          | IANA tz picker |

Consumers that don't recognise a widget fall back to the type's default control,
so a manifest is never unrenderable.

## `launch` — settings → URL

```jsonc
"launch": {
  "baseUrl": "https://weather.srly.io/",  // required
  "template": "{?location*,24h}"          // RFC 6570 URI Template over setting names
}
```

- `template` is an [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570) URI
  Template whose variables are the `settings` property names.
- **Put every query parameter in one `{?…}` expression.** Do not chain
  `{?a}{&b}` — each expression expands independently, so `{&b}` emits a stray
  leading `&` (a malformed `…/&b=` URL) whenever the earlier `{?a}` group is
  empty.
- **Only *undefined* variables are dropped.** An empty string still expands to
  `name=`. So the URL builder must **omit** a setting that is empty or at its
  default (pass it as undefined) — never feed `""` into the template.
- Map each setting type to the wire form:
  - **object** → explode (`{?location*}`) to emit its keys as params:
    `?lat=…&lng=…`.
  - **array** → explode (`{?tz*}`) to repeat the param: `tz=…&tz=…`; compose
    composite item tokens with `x-format`.
  - **boolean** → the string `1` when true, **omitted** when false. Accept
    `foo=1`, not a bare `foo` flag.
  - keep each param name identical to its setting name so the template stays 1:1.
- A setting/param name may start with a digit (e.g. `24h`) — valid per RFC 6570,
  but a few template libraries reject it, so verify your consumer handles it.
- RFC 6570 percent-encodes reserved characters (`/`, `|`, spaces). An app that
  documents literal reserved chars in its URLs must also accept the encoded forms.
- Omit `template` for apps with no settings; `baseUrl` is then the launch URL.

## Worked examples

### Weather (`lat`/`lng` + clock format)

```jsonc
{
  "manifestVersion": "1",
  "id": "weather",
  "name": "Weather",
  "description": "A live weather display with the location and clock format you choose.",
  "summary": "Live local weather for any display.",
  "tags": ["Weather", "Clock"],
  "source": "https://github.com/Screenly-Labs/weather-app",
  "support": "https://github.com/Screenly-Labs/weather-app/issues",
  "playback": { "pacing": "fixed", "refreshIntervalS": 3600 },
  "settings": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "location": {
        "type": "object", "title": "Location", "x-widget": "location-map",
        "properties": {
          "lat": { "type": "number" },
          "lng": { "type": "number" }
        }
      },
      "24h": {
        "type": "string", "title": "Clock format", "default": "",
        "enum": ["", "0", "1"],
        "x-enumLabels": ["Default", "12-hour", "24-hour"]
      }
    }
  },
  "launch": {
    "baseUrl": "https://weather.srly.io/",
    "template": "{?location*,24h}"
  }
}
```

### World Clock (repeated cities, composite tokens, flag)

```jsonc
{
  "manifestVersion": "1",
  "id": "world-clock",
  "name": "World Clock",
  "description": "A full-screen board of city clocks for any display.",
  "summary": "Every time zone that matters, on one screen.",
  "tags": ["Clock"],
  "source": "https://github.com/Screenly-Labs/world-clock",
  "support": "https://github.com/Screenly-Labs/world-clock/issues",
  "settings": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "title": { "type": "string", "title": "Board title" },
      "tz": {
        "type": "array", "title": "Cities",
        "items": {
          "type": "object",
          "x-widget": "timezone",
          "x-format": "{zone}|{label}",
          "properties": {
            "zone":  { "type": "string" },
            "label": { "type": "string" }
          },
          "required": ["zone"]
        }
      },
      "locale": {
        "type": "string", "title": "Language & region", "default": "",
        "enum": ["", "en-US", "de-DE", "fr-FR", "es-ES", "ja-JP"],
        "x-enumLabels": ["English (UK)", "English (US)", "German", "French", "Spanish", "Japanese"]
      },
      "format": {
        "type": "string", "title": "Clock format", "default": "",
        "enum": ["", "12", "24"],
        "x-enumLabels": ["Match language", "12-hour", "24-hour"]
      },
      "seconds": { "type": "boolean", "title": "Show seconds", "default": false }
    }
  },
  "launch": {
    "baseUrl": "https://world-clock.srly.io/",
    "template": "{?title,tz*,locale,format,seconds}"
  }
}
```

> Every param sits in the one `{?…}` expression, so whichever value is present
> first gets the `?`. `tz*` explodes the array and `x-format` composes each item
> (`Zone|Label`, or just `Zone` when the label is blank). Two backwards-compatible
> app-side tweaks make it expressible: accept `seconds=1` (a value, not a bare
> flag) and `tz=Zone|Label` repeated. Note RFC 6570 percent-encodes the `/` and
> `|` in each token (`Europe%2FStockholm%7CHome`), so the app must accept the
> encoded forms — it won't be the byte-for-byte literal URL the app documents.

### No-settings app (e.g. Quotes)

```jsonc
{
  "manifestVersion": "1",
  "id": "quotes",
  "name": "Quotes",
  "description": "A full-screen quotation for any display.",
  "summary": "A fresh quote for any display.",
  "tags": ["Quotes"],
  "source": "https://github.com/Screenly-Labs/quotes",
  "support": "https://github.com/Screenly-Labs/quotes/issues",
  "launch": { "baseUrl": "https://quotes.srly.io/" }
}
```

## Validation

Manifests validate against
[`static/schemas/signage-app-manifest.schema.json`](../static/schemas/signage-app-manifest.schema.json).
The store's index build rejects any app whose manifest fails validation.
