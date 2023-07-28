"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { dogSessions, sessions, users } from "~/db/schemas";
import { UpdateUserSchema } from "~/db/validation";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { createServerAction, getServerSession, getServerUser } from "../utils";

const updateUser = createServerAction(async (data: UpdateUserSchema) => {
	const validation = UpdateUserSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues };
	}

	try {
		const currentSession = await getServerSession();

		await drizzle.update(users).set(validation.data).where(eq(users.id, currentSession.user.id));

		const newSessionToken = await createSessionJWT({
			id: currentSession.id,
			createdAt: currentSession.createdAt,
			updatedAt: new Date(),
			user: {
				...currentSession.user,
				...validation.data,
			},
		});

		await drizzle
			.update(sessions)
			.set({
				sessionToken: newSessionToken,
			})
			.where(eq(sessions.id, currentSession.id));

		cookies().set({
			...sessionCookieOptions,
			value: newSessionToken,
		});

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to update user" };
	}
});

const deleteUser = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole === "member" && user.id !== validation.data) {
			return { success: false, error: "You can only delete your own account" };
		}

		await drizzle
			.delete(users)
			.where(and(eq(users.organizationId, user.organizationId), eq(users.id, validation.data)));

		await drizzle
			.update(dogSessions)
			.set({ userId: null })
			.where(and(eq(dogSessions.organizationId, user.organizationId), eq(dogSessions.userId, validation.data)));

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete user" };
	}
});

export { updateUser, deleteUser };
