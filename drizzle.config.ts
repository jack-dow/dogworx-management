import type { Config } from "drizzle-kit";

export default {
	out: "./src/db/migrations",
	schema: "./src/db/schema/*",
	breakpoints: true,
	driver: "mysql2",
	dbCredentials: {
		connectionString: process.env.DATABASE_URL!,
	},
} satisfies Config;
