# Build the static site with Hugo (extended) using Bun-managed JS dependencies,
# then serve the output with nginx.
FROM oven/bun:1 AS build
WORKDIR /src

ARG HUGO_VERSION=0.157.0

# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -sSL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" \
       | tar -xz -C /usr/local/bin hugo \
    && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Install JS dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN hugo --gc --minify

FROM nginx:stable-alpine AS runtime
COPY --from=build /src/public /usr/share/nginx/html
EXPOSE 80
