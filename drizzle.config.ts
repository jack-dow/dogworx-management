import type { Config } from "drizzle-kit";

export default {
	out: "./src/server/db/migrations",
	schema: "./src/server/db/schemas/*",
	breakpoints: true,
	driver: "mysql2",
	dbCredentials: {
		connectionString: process.env.DATABASE_URL!,
	},
} satisfies Config;
