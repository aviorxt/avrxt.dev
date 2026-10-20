# jsDelivr policy

AVRXT uses jsDelivr only for opt-in, browser-only third-party scripts. It is
not a replacement for npm dependencies, Vercel deployments, private S3 files,
or user uploads.

## Rules

- Pin every URL to an exact package version. Never use `latest`, a tag, or a range.
- Use `JsDelivrScript` rather than writing a CDN URL directly in a page.
- Supply an SRI `sha384-...` or `sha512-...` hash and keep `crossOrigin="anonymous"`.
- Default to `lazyOnload`; use `afterInteractive` only when the page needs the
  library immediately after hydration.
- Keep React, Next.js, shadcn UI, authentication, and all application code in npm.
- Do not put credentials, signed URLs, private assets, or personal uploads on jsDelivr.

## Example

```tsx
import JsDelivrScript from "@/components/JsDelivrScript";

<JsDelivrScript
  id="example-library"
  packageName="example-package"
  version="1.2.3"
  file="dist/example.min.js"
  integrity="sha384-REPLACE_WITH_THE_PUBLISHED_HASH"
/>
```

Generate or obtain the integrity value from the exact published file before
shipping it. Do not add a CDN resource merely because it is available.
