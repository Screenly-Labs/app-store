{{- $meta := partialCached "app-meta.html" . .RelPermalink -}}
{{- $html := (.OutputFormats.Get "html").Permalink -}}
# {{ $meta.title }}

{{ $meta.description }}

{{ with $meta.install -}}
- Install: {{ .url }}
- {{ .note }}
{{- else -}}
- App link: {{ $meta.url }}
- Paste the app link into Anthias, Screenly, or any smart TV or signage player that can show a web page.
{{- end }}
{{- with $meta.tags }}
- Categories: {{ delimit . ", " }}
{{- end }}
{{- with $meta.source }}
- Source code: {{ . }}
{{- end }}
{{- with $meta.support }}
- Support: {{ . }}
{{- end }}
{{- with .Params.manifest }}
- Manifest: {{ . }}
{{- end }}
{{ with $meta.manifest }}{{ with partial "md-settings.html" . }}
{{ . }}
{{ end }}{{ end }}
{{ with .Content }}{{ partial "html-to-md.html" . }}
{{ end }}
---
From {{ site.Title }}: {{ $html }}
