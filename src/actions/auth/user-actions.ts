"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schema";
import { UpdateUserSchema } from "~/db/validation";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { createServerAction, getServerSession, getServerUser } from "../utils";

const updateUser = createServerAction(async (data: UpdateUserSchema) => {
	const validation = UpdateUserSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const currentSession = await getServerSession();

		await drizzle.update(users).set(validation.data).where(eq(users.id, currentSession.user.id));

		const newSessionToken = await createSessionJWT({
			id: currentSession.id,
			user: {
				...currentSession.user,
				...validation.data,
			},
		});

		cookies().set({
			...sessionCookieOptions,
			value: newSessionToken,
		});

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to update user", data: null };
	}
});

const deleteUser = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole === "member" && user.id !== validation.data) {
			return { success: false, error: "You can only delete your own account", data: null };
		}

		await drizzle
			.delete(users)
			.where(and(eq(users.organizationId, user.organizationId), eq(users.id, validation.data)));

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to delete user", data: null };
	}
});

export { updateUser, deleteUser };
