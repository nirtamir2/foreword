# Full-Stack App Template

Reusable infrastructure template for new products.

## Stack

- TypeScript monorepo with `pnpm` workspaces
- React + TanStack Start + TanStack Router
- Better Auth with Prisma/PostgreSQL, Google OAuth, and OAuth proxy support
- oRPC with TanStack Query helpers
- Tailwind CSS and reusable UI primitives
- Paraglide i18n with English and Hebrew locales
- Android Trusted Web Activity wrapper

## Create A New Project

1. Use this repository as a GitHub template.
2. Replace package names and app identity:
   - `fullstack-app-template`
   - `@app-template/*`
   - `App Template`
   - `com.example.app`
   - `example.com`
3. Copy `apps/web/.env.example` to `apps/web/.env` and fill real values.
4. Create a Google OAuth client and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
   Add this redirect URI in Google Cloud for each auth origin you use:

```text
https://your-domain.com/api/auth/callback/google
```

   For preview URLs, development tunnels, or Portless-style local URLs, set
   `OAUTH_PROXY_PRODUCTION_URL` to the production auth origin registered with Google.
5. Install and generate the Prisma client:

```bash
pnpm install
pnpm run db:generate
```

6. Push the starter auth schema to your database:

```bash
pnpm run db:push
```

7. Start the web app:

```bash
pnpm run dev:web
```

Open [http://localhost:3001](http://localhost:3001).

## Scripts

- `pnpm run dev:web` - run the TanStack Start app
- `pnpm run build` - build all workspaces
- `pnpm run type-check` - type-check all workspaces
- `pnpm run lint` - run ESLint
- `pnpm run db:generate` - generate the Prisma client
- `pnpm run db:push` - push schema changes to the database
- `pnpm run db:migrate` - create and apply Prisma migrations
- `pnpm run db:studio` - open Prisma Studio

## Template Notes

- The starter database schema contains Better Auth tables, including the `account` table fields
  Better Auth uses for OAuth provider IDs and tokens.
- The API exposes `healthCheck` and `privateData` examples in `packages/api`.
- Legal and accessibility pages are placeholders and must be customized before launch.
- Android files are configured as a neutral TWA shell. Update `apps/android/twa-manifest.json`,
  `apps/android/app/build.gradle`, and `.well-known/assetlinks.json` for your production domain
  and signing certificate.
