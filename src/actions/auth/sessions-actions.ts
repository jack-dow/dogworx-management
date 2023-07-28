"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { sessions } from "~/db/schemas";
import { sessionCookieOptions, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";
import { createServerAction, getServerUser } from "../utils";

function getSessionToken() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	return sessionCookie?.value;
}

async function getCurrentSession() {
	const sessionToken = getSessionToken();

	if (!sessionToken) {
		redirect("/sign-in");
	}

	const data = (await jwt.verify(sessionToken)) as SessionCookie;

	return data;
}

const invalidateSession = createServerAction(async (id: string) => {
	const validId = z.string().safeParse(id);

	if (!validId.success) {
		return { success: false, error: validId.error.issues };
	}
	try {
		const user = await getServerUser();

		await drizzle
			.update(sessions)
			.set({
				expiresAt: new Date(),
			})
			.where(and(eq(sessions.userId, user.id), eq(sessions.id, validId.data)));

		return { success: true, data: validId.data };
	} catch (error) {
		console.log(error);
		return { success: false, error: "Failed to delete organization" };
	}
});

export { getCurrentSession, invalidateSession };