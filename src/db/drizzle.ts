import { connect } from "@planetscale/database";

import { drizzle as createDrizzle } from "drizzle-orm/planetscale-serverless";


import { env } from "~/env.mjs";
import * as schema from "./drizzle-schema";

const connection = connect({
	host: env.DATABASE_HOST,
	username: env.DATABASE_USERNAME,
	password: env.DATABASE_PASSWORD,
});

export const drizzle = createDrizzle(connection, {
	logger: true,
	schema,
});

