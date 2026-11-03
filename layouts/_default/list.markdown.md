{{- /* index.md for a hub (/rss/, /examples/, /digital-notice-board/): its copy,
     the front-matter tiles that _default/list.html lays out, and its apps. The
     app lists match the HTML: /rss/ lists its feeds, the other hubs every app
     except the feeds. */ -}}
{{- $html := (.OutputFormats.Get "html").Permalink -}}
# {{ .Title }}

{{ with .Content }}{{ partial "html-to-md.html" . }}

{{ end -}}
{{- with .Params.includes }}## What goes on it
{{ range . }}
### {{ .title }}

{{ partial "html-to-md.html" (.body | markdownify) }}
{{ end }}
{{ end -}}
{{- with .Params.cases }}## {{ $.Params.casesEyebrow | default "Where it goes" }}
{{ range . }}
### {{ .title }}

{{ partial "html-to-md.html" (.body | markdownify) }}
{{ end }}
{{ end -}}
{{- with .Params.closing }}{{ range . }}## {{ .title }}

{{ partial "html-to-md.html" (.body | markdownify) }}

{{ end }}{{ end -}}
{{- if eq .Section "rss" }}## Feeds
{{ range .Pages.ByTitle }}
{{ partial "md-app-row.html" . }}
{{- end }}
{{- else }}## Apps
{{ range (where site.RegularPages "Section" "!=" "rss").ByWeight }}
{{ partial "md-app-row.html" . }}
{{- end }}
{{- end }}

---
From {{ site.Title }}: {{ $html }}
