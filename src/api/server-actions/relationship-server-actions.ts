"use server";

import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { dogToVetRelationships, vetToVetClinicRelationships } from "~/db/drizzle-schema";
import { createServerAction } from "../utils";

const getVetRelationships = createServerAction(async (vetId: string) => {
	try {
		const dogToVetRelationshipsData = await drizzle.query.dogToVetRelationships.findMany({
			limit: 25,
			where: eq(dogToVetRelationships.vetId, vetId),
			with: {
				dog: true,
			},
		});

		const vetToVetClinicRelationshipsData = await drizzle.query.vetToVetClinicRelationships.findMany({
			limit: 25,
			where: eq(vetToVetClinicRelationships.vetId, vetId),
			with: {
				vetClinic: true,
			},
		});

		return {
			success: true,
			data: {
				dogToVetRelationships: dogToVetRelationshipsData,
				vetToVetClinicRelationships: vetToVetClinicRelationshipsData,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to get vet relationships with vet id: "${vetId}"` };
	}
});

const getVetClinicRelationships = createServerAction(async (vetClinicId: string) => {
	try {
		const vetToVetClinicRelationshipsData = await drizzle.query.vetToVetClinicRelationships.findMany({
			limit: 25,
			where: eq(vetToVetClinicRelationships.vetId, vetClinicId),
			with: {
				vet: true,
			},
		});

		return {
			success: true,
			data: {
				vetToVetClinicRelationships: vetToVetClinicRelationshipsData,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false, error: `Failed to get vet clinic relationships with vet clinic id: "${vetClinicId}"` };
	}
});

export { getVetRelationships, getVetClinicRelationships };
