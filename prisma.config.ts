// Prisma config for Supabase PostgreSQL
// See: https://www.prisma.io/docs/orm/overview/databases/supabase
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Used by Prisma Migrate / db push (direct connection, port 5432)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
