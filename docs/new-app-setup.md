# Setting up a new signage app repo

The code for a Pages-based signage app is a copy of an existing one (see
[`opening-hours`](https://github.com/Screenly-Labs/opening-hours) for the
canonical static Tailwind layout). What is **not** in the repo is the GitHub
configuration around it, and one piece of that will silently fail the first
deploy if you skip it.

Run through this once per new app.

## 1. Create the repo

Public, in `Screenly-Labs`, to match the rest:

```sh
gh repo create Screenly-Labs/<app> --public \
  --description "<App> app for digital signage." \
  --homepage "https://<app>.srly.io/"
```

## 2. Enable Pages, built by Actions

```sh
gh api -X POST repos/Screenly-Labs/<app>/pages -f 'build_type=workflow'
```

## 3. Allow the deploy tag — the step that catches people out

Our apps **deploy from a CalVer tag**, not from a push to `master`
(`deploy-pages.yml` triggers on `[0-9][0-9][0-9][0-9].*` and
`workflow_dispatch`). But GitHub creates the `github-pages` environment with a
deployment policy that only permits the **default branch**. A tag is not covered
by it, so the first release fails at the Deploy job — after Build has already
succeeded — with:

```
Tag "2026.8.0" is not allowed to deploy to github-pages
due to environment protection rules.
```

Add the tag policy:

```sh
gh api -X POST repos/Screenly-Labs/<app>/environments/github-pages/deployment-branch-policies \
  -f 'name=[0-9][0-9][0-9][0-9].*' -f 'type=tag'
```

Confirm it took — you want both entries:

```sh
gh api repos/Screenly-Labs/<app>/environments/github-pages/deployment-branch-policies \
  --jq '.branch_policies[] | "\(.type): \(.name)"'
# branch: master
# tag: [0-9][0-9][0-9][0-9].*
```

Every existing Pages app already has this; it was added by hand each time.

## 4. DNS

A `CNAME` for the app's subdomain, proxied through Cloudflare like its siblings:

```
<app>.srly.io  CNAME  screenly-labs.github.io
```

## 5. Custom domain — set it *after* DNS resolves, and on its own

GitHub verifies the domain before accepting it, so this fails while DNS is still
propagating. It also fails if you set `https_enforced` in the same call, because
the certificate does not exist until the domain is attached:

```
The certificate does not exist yet (HTTP 404)
```

Set the domain by itself:

```sh
gh api -X PUT repos/Screenly-Labs/<app>/pages -f 'cname=<app>.srly.io'
```

Then check `protected_domain_state` is `verified`.

**Leave `https_enforced` alone.** These domains are proxied through Cloudflare,
which terminates TLS itself, so GitHub never issues its own certificate and
`https_certificate` stays `null`. That matches every existing app and is not a
misconfiguration — the site is served over HTTPS by Cloudflare.

## 6. Cut the first release

```sh
git tag 2026.8.0 && git push origin 2026.8.0
```

The build writes the `CNAME` file into `dist/`, so the custom domain is re-claimed
on every deploy.

## Checklist

- [ ] Repo created, public, homepage set
- [ ] Pages enabled with `build_type=workflow`
- [ ] **Tag deployment policy added**
- [ ] DNS `CNAME` resolves
- [ ] Custom domain set and `verified`
- [ ] First tag pushed, deploy green
- [ ] Manifest reachable at `https://<app>.srly.io/.well-known/signage-app.json`
      with `content-type: application/json` and `access-control-allow-origin: *`
