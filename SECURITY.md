# Security policy

Filrouge is built for people who handle sensitive investigation data. Security reports are
welcome and taken seriously.

## Reporting a vulnerability

Please **do not open a public issue**. Use **Report a vulnerability** (GitHub Security Advisories)
in the repository's **Security** tab. We aim to reply within 7 days.

Useful details: affected version or commit, browser, steps to reproduce, and, if relevant, a
minimal investigation file (JSON export) that triggers the issue. Never send real investigation
data.

## Supported versions

Filrouge is a static web app without releases yet: only the latest `main` (the version served at
https://filrouge.iamludal.fr) receives fixes.

## Threat model (summary)

- **Local data**: investigations live in the browser's IndexedDB, on this device only. Anyone with
  access to your browser session can read them. Per-investigation encryption is planned for v1.0
  (see [ROADMAP.md](./ROADMAP.md)); until then, lock your session and use a dedicated browser
  profile for sensitive work.
- **Origin isolation**: IndexedDB is shared per origin. Deploy Filrouge on a dedicated domain or
  subdomain, never on a subpath of a shared origin (`<user>.github.io/...`): every other site on
  that origin could read your investigations.
- **Hostile content**: labels, notes, URLs and imported files are treated as malicious. Imports are
  validated by Zod schemas before reaching the app, with size limits and checks on embedded
  screenshots (type, size, SHA-256). Markdown notes are rendered without raw HTML and links are
  limited to `http(s)` and `mailto`. `dangerouslySetInnerHTML` is forbidden by an ESLint rule.
- **Zero leak**: no backend, no telemetry, no analytics, no CDN. The production build ships a
  strict Content Security Policy that blocks third-party scripts, remote images (tracking pixels
  in a note) and outgoing requests:

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self';
  object-src 'none'; base-uri 'self'; form-action 'none'
  ```

  Only inline styles are allowed (required by Radix). Pages are served with
  `referrer: no-referrer`, and pivot links open in a new tab with `noopener noreferrer`, only when
  you click them.

## Out of scope

- Attacks that require control of your device, browser or browser extensions.
- Content of the third-party websites that pivot links open.
- Self-hosted instances served from a shared origin (see "Origin isolation").
