"use server";

import { drizzle } from "../drizzle";
import * as schema from "../drizzle-schema";
import generateSeedData from "./generate-seed-data";

const data = generateSeedData();

const seed = async () => {
	try {
		await drizzle.transaction(async (db) => {
			await db.delete(schema.dogs);
			await db.delete(schema.dogSessions);
			await db.delete(schema.clients);
			await db.delete(schema.vets);
			await db.delete(schema.vetClinics);
			await db.delete(schema.dogToClientRelationships);
			await db.delete(schema.dogToVetRelationships);
			await db.delete(schema.vetToVetClinicRelationships);
		});
		console.log("[Success] Deleted all existing data");

		await drizzle.transaction(async (db) => {
			await db.insert(schema.dogs).values(data.dogs);
			await db.insert(schema.dogSessions).values(data.dogSessions);
			await db.insert(schema.clients).values(data.clients);
			await db.insert(schema.vets).values(data.vets);
			await db.insert(schema.vetClinics).values(data.vetClinics);
			await db.insert(schema.dogToClientRelationships).values(data.dogToClientRelationships);
			await db.insert(schema.dogToVetRelationships).values(data.dogToVetRelationships);
			await db.insert(schema.vetToVetClinicRelationships).values(data.vetToVetClinicRelationships);
		});
		console.log("[Success] Inserted seed data");
	} catch (error) {
		console.log(error);
		throw new Error("Failed to seed database");
	}
};

export { seed };
