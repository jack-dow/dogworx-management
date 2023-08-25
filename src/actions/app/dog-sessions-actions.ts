"use server";

import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogSessions } from "~/db/schema";
import { InsertDogSessionSchema, UpdateDogSessionSchema } from "~/db/validation";
import { createServerAction, getServerUser, type ExtractServerActionData } from "../utils";

const CursorSchema = z.object({
	id: z.string().cuid2(),
	date: z.date(),
});

const searchDogSessions = createServerAction(async (cursor: { id: string; date: Date; dogId: string }) => {
	const validation = CursorSchema.safeParse(cursor);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = await drizzle.query.dogSessions.findMany({
			limit: 3,
			where: (dogSessions, { eq, or, and }) =>
				and(
					eq(dogSessions.organizationId, user.organizationId),
					eq(dogSessions.dogId, cursor.dogId),
					or(lt(dogSessions.date, cursor.date), and(eq(dogSessions.date, cursor.date), gt(dogSessions.id, cursor.id))),
				),
			orderBy: (dogSessions, { asc }) => [desc(dogSessions.date), asc(dogSessions.id)],
			with: {
				user: {
					columns: {
						id: true,
						givenName: true,
						familyName: true,
						emailAddress: true,
						organizationId: true,
						organizationRole: true,
						profileImageUrl: true,
					},
				},
			},
		});

		return {
			success: true,
			data,
		};
	} catch {
		return { success: false, error: "Failed to search dog sessions", data: null };
	}
});
type DogSessionsSearch = ExtractServerActionData<typeof searchDogSessions>;

const insertDogSession = createServerAction(async (values: InsertDogSessionSchema) => {
	const validation = InsertDogSessionSchema.safeParse(values);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const data = validation.data;

		await drizzle.transaction(async (trx) => {
			await trx.insert(dogSessions).values({
				...data,
				organizationId: user.organizationId,
			});
		});

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: `Failed to insert dog session with id: ${validation.data.id}`, data: null };
	}
});
type DogSessionInsert = ExtractServerActionData<typeof insertDogSession>;

const updateDogSession = createServerAction(async (values: UpdateDogSessionSchema) => {
	const validation = UpdateDogSessionSchema.safeParse(values);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		const { id, ...data } = validation.data;

		await drizzle
			.update(dogSessions)
			.set(data)
			.where(and(eq(dogSessions.organizationId, user.organizationId), eq(dogSessions.id, id)));

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: `Failed to update dog session with id: ${validation.data.id}`, data: null };
	}
});
type DogSessionUpdate = ExtractServerActionData<typeof updateDogSession>;

const deleteDogSession = createServerAction(async (dogSession: { id: string; dogId: string }) => {
	const validation = z.object({ id: z.string(), dogId: z.string() }).safeParse(dogSession);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		await drizzle
			.delete(dogSessions)
			.where(and(eq(dogSessions.organizationId, user.organizationId), eq(dogSessions.id, dogSession.id)));

		const countQuery = await drizzle
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(dogSessions)
			.where(and(eq(dogSessions.organizationId, user.organizationId), eq(dogSessions.dogId, dogSession.dogId)));

		return {
			success: true,
			data: {
				count: countQuery[0]?.count ?? 0,
			},
		};
	} catch {
		return { success: false, error: `Failed to delete dog session with id: ${dogSession.id}`, data: null };
	}
});
type DogSessionDelete = ExtractServerActionData<typeof deleteDogSession>;

export {
	searchDogSessions,
	type DogSessionsSearch,
	insertDogSession,
	type DogSessionInsert,
	updateDogSession,
	type DogSessionUpdate,
	deleteDogSession,
	type DogSessionDelete,
};
