{{- $apps := (where site.RegularPages "Section" "!=" "rss").ByWeight -}}
# {{ site.Title }}

{{ site.Params.description }}

Every app is a plain URL: pick one, copy its app link, and paste it into Anthias (free and open-source), Screenly, or any smart TV or signage player that can show a web page. Many apps take settings in the link's query string, and each app's page lists them. Every page on this site is also available as Markdown: append `index.md` to its URL.

## Apps

{{ range $apps }}{{ partial "md-app-row.html" . }}
{{ end }}
## Collections

{{ range site.Home.Sections.ByTitle }}{{ $s := . }}{{ with .OutputFormats.Get "markdown" }}- [{{ $s.Title }}]({{ .Permalink }}){{ with $s.Params.metadescription }}: {{ . }}{{ end }}
{{ end }}{{ end }}
---
From {{ site.Title }}: {{ (.OutputFormats.Get "html").Permalink }}
