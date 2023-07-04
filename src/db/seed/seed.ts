"use server";

import { drizzle } from "../drizzle";
import * as schema from "../drizzle-schema";
import * as data from "./data";

const seed = async () => {
	try {
		await drizzle.transaction(async (db) => {
			await db.delete(schema.clients);
			await db.delete(schema.dogClientRelationships);
			await db.delete(schema.dogs);
			await db.delete(schema.dogSessionHistory);
		});
		console.log("[Success] Deleted all existing data");

		await drizzle.transaction(async (db) => {
			await db.insert(schema.clients).values(data.clients);
			await db.insert(schema.dogs).values(data.dogs);
			await db.insert(schema.dogClientRelationships).values(data.dogClientRelationships);
			await db.insert(schema.dogSessionHistory).values(data.dogSessions);
		});
		console.log("[Success] Inserted seed data");
	} catch (error) {
		console.log(error);
		throw new Error("Failed to seed database");
	}
};

export { seed };
