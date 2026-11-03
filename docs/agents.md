# Pages for AI agents

Everything an agent needs to read the store, and to build a configured app link,
is static and is built with the site. There is no server, so nothing here depends
on content negotiation.

## What is built

| URL | What | Template |
| --- | --- | --- |
| `/llms.txt` | A guide to the site for agents ([llmstxt.org](https://llmstxt.org)): where things are, how to build an app link from a manifest, every app and collection | `layouts/index.llms.txt` |
| `/index.md` | The home page as Markdown: every app and collection | `layouts/index.markdown.md` |
| `/<app>/index.md` | An app page as Markdown: the app link, its settings and what each one takes, and the page copy | `layouts/_default/single.markdown.md` |
| `/<hub>/index.md` | A hub (`/rss/`, `/examples/`, `/digital-notice-board/`) as Markdown, with its apps | `layouts/_default/list.markdown.md` |

Every HTML page links its Markdown with `<link rel="alternate" type="text/markdown">`,
and app and hub pages carry page tools (`layouts/partials/agent-tools.html`):
Copy as Markdown, and under More, View as Markdown, Ask Claude, Ask ChatGPT and
Copy page link. The Ask links open the assistant with a question that points it at
the page's `index.md`.

## How the Markdown is made

App pages are written in HTML, so there is no Markdown source to reuse.
`layouts/partials/html-to-md.html` converts a page's rendered body back to
Markdown. It handles the tags the content uses today: `h2` to `h4`, `p`, `ul`,
`ol`, `li`, `a`, `strong`, `em`, `code` and `br`. Any other tag is dropped and its
text kept. **If you start using a new tag in content, add it there**, or check the
page's `index.md` after building.

Shortcodes need a Markdown version too, or their HTML is flattened to text:
`layouts/shortcodes/screenshot.markdown.md` is the one for `screenshot`.

An app's settings come from its manifest (`layouts/partials/md-settings.html`),
listed in `launch.template` order with their allowed values, so an agent can fill
in the query string without the form.

## Hosting

The Markdown says the same thing as the HTML page, so it must not compete with it
in search. `static/_headers` tells Cloudflare Pages to send `X-Robots-Tag: noindex`
and a UTF-8 `Content-Type` for `*.md`. The Markdown and `llms.txt` are left out of
the sitemap. `nginx-markdown.conf` does the same job for the local Docker preview.
