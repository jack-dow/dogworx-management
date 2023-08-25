import { connect } from "@planetscale/database";
import { type Logger } from "drizzle-orm";
import { drizzle as createDrizzle } from "drizzle-orm/planetscale-serverless";

import { env } from "~/env.mjs";
import * as schema from "./schema";

const connection = connect({
	host: env.DATABASE_HOST,
	username: env.DATABASE_USERNAME,
	password: env.DATABASE_PASSWORD,
});

function formatQuery(query: string, params: unknown[]): string {
	let formattedQuery = query;
	for (let i = 0; i < params.length; i++) {
		const paramValue = typeof params[i] === "string" ? `'${params[i] as string}'` : params[i];
		formattedQuery = formattedQuery.replace(`?`, String(paramValue));
	}
	return formattedQuery;
}

function generateLog(query: string, params: unknown[]): string {
	const timestamp = new Date().toLocaleTimeString();
	const formattedQuery = formatQuery(query, params);
	const log = `[${timestamp}] ${formattedQuery}`;
	return log;
}

class MyLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		console.log(generateLog(query, params));
	}
}

export const drizzle = createDrizzle(connection, {
	logger: false,
	schema,
	logger: process.env.NODE_ENV === "development" ? new MyLogger() : false,
});
