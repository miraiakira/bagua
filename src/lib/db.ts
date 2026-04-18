import { Pool } from "pg";

const databaseURL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/bagua?sslmode=disable";

declare global {
  var __baguaPool__: Pool | undefined;
}

export const dbPool =
  globalThis.__baguaPool__ ??
  new Pool({
    connectionString: databaseURL,
  });

if (!globalThis.__baguaPool__) {
  globalThis.__baguaPool__ = dbPool;
}
