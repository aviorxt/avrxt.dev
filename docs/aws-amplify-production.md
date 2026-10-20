# AWS Amplify production branch

This `aws` branch is the Amplify Hosting variant of AVRXT. It keeps the same
Next.js SSR application and public routes as `version-5.6`, but pins the app to
the currently supported Amplify Next.js major release and supplies the required
build specification.

## Before connecting the branch

1. In AWS Amplify Hosting, create an app from `aviorxt/avrxt-in-1` and select
   the `aws` branch.
2. Use the managed SSR/compute hosting option and Node.js 24.
3. Keep the build specification from `amplify.yml`. Its artifact directory is
   `.next`; do not configure a static `out` directory.
4. Add the required runtime variables in **Amplify → App settings → Environment
   variables**. `scripts/amplify-write-runtime-env.mjs` copies only explicitly
   named variables into `.env.production` for the Next.js server artifact.
5. Grant the Amplify compute role least-privilege IAM access to the S3 bucket.
   Prefer IAM role credentials instead of `AWS_ACCESS_KEY_ID` and
   `AWS_SECRET_ACCESS_KEY` when the application no longer needs a non-AWS
   deployment target.

## Required minimum variables

For sign-in and server sessions: `AUTH_SESSION_SECRET`, `AUTH_CALLBACK_ORIGIN`,
`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`,
`DISCORD_ROLE_ID`, `DISCORD_ADMIN_USER_ID`, `DISCORD_TOKEN`, `REDIS_REST_URL`,
and `REDIS_REST_TOKEN`.

For profile data: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

Add the remaining variables only for the features you enable (mail, Mux,
Spotify, S3 storage, status monitoring, payments, search, and R2 media).

## Domain cutover

Do not alter DNS or the Discord OAuth callback during the first deployment.
Test the Amplify branch URL first. When ready, add `avrxt.dev` and
`www.avrxt.dev` as Amplify custom domains, validate the ACM certificate, then
update Cloudflare DNS. Keep `AUTH_CALLBACK_ORIGIN` as
`https://www.avrxt.dev` and keep this exact Discord callback:

`https://www.avrxt.dev/auth/o1/dc/callback`

If Cloudflare remains proxied, Cloudflare remains the browser-facing TLS
terminator. Set Cloudflare SSL/TLS to Full (strict) after the Amplify ACM
certificate is active.
