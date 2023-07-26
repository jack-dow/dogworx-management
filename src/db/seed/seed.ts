"use server";

import { drizzle } from "../drizzle";
import { Schemas } from "../schemas";
import generateSeedData from "./generate-seed-data";

const data = generateSeedData();

const seed = async () => {
	try {
		await drizzle.transaction(async (db) => {
			await db.delete(Schemas.dogs);
			await db.delete(Schemas.dogSessions);
			await db.delete(Schemas.clients);
			await db.delete(Schemas.vets);
			await db.delete(Schemas.vetClinics);
			await db.delete(Schemas.dogToClientRelationships);
			await db.delete(Schemas.dogToVetRelationships);
			await db.delete(Schemas.vetToVetClinicRelationships);
		});
		console.log("[Success] Deleted all existing data");

		await drizzle.transaction(async (db) => {
			await db.insert(Schemas.dogs).values(data.dogs);
			await db.insert(Schemas.dogSessions).values(data.dogSessions);
			await db.insert(Schemas.clients).values(data.clients);
			await db.insert(Schemas.vets).values(data.vets);
			await db.insert(Schemas.vetClinics).values(data.vetClinics);
			await db.insert(Schemas.dogToClientRelationships).values(data.dogToClientRelationships);
			await db.insert(Schemas.dogToVetRelationships).values(data.dogToVetRelationships);
			await db.insert(Schemas.vetToVetClinicRelationships).values(data.vetToVetClinicRelationships);
		});
		console.log("[Success] Inserted seed data");
	} catch (error) {
		console.log(error);
		throw new Error("Failed to seed database");
	}
};

export { seed };
