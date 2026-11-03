{{- /* The index.md version of shortcodes/screenshot.html: a Markdown image of the
     largest webp the HTML page already ships, with its caption beneath. The <p>
     wrappers are block breaks for partials/html-to-md.html, which removes them. */ -}}
{{- $src := .Get "src" -}}
{{- $img := (resources.Get (printf "img/%s" $src)).Process "resize 1280x webp q82" -}}
<p>![{{ .Get "alt" }}]({{ $img.Permalink }})</p>
{{- with .Get "caption" }}<p>*{{ . }}*</p>{{ end }}
