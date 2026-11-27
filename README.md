# Taskloom

Taskloom is a small project and task tracker built with Next.js 16, React 19, Drizzle ORM and Postgres (Supabase).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and fill in your Supabase connection strings:

   ```bash
   cp .env.example .env.local
   ```

   - `DATABASE_URL`: the transaction pooler string (port 6543). Used by the app at runtime.
   - `DATABASE_URL_DIRECT`: the session pooler string (port 5432). Used by migrations.

   The app throws `DATABASE_URL is not set` at runtime if the variable is missing.

3. Create the tables:

   ```bash
   npm run db:migrate
   ```

4. Start the development server and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

Other useful scripts:

- `npm run keep-alive`: checks that the database is reachable.
- `npm run db:studio`: opens Drizzle Studio to browse the data.
- `npm run lint` and `npm run build`: lint and production build.

Set the same environment variables in your hosting provider before deploying.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
