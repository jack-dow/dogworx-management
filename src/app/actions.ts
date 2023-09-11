"use server";

import { cookies } from "next/headers";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schema/auth";
import { type UpdateUserSchema } from "~/db/validation/auth";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { server } from "~/lib/trpc/server";

dayjs.extend(utc);
dayjs.extend(timezone);

// These actions exist here and not within TRPC as there is currently a bug in TRPC, that if you provide a .input() to a procedure,
// it will not be able to set cookies on the response. This is a workaround until that bug is fixed.

// eslint-disable-next-line @typescript-eslint/require-await
export async function setTimezone({ timezone }: { timezone: string }) {
	if (dayjs().tz(timezone, true).isValid()) {
		cookies().set("timezone", timezone, {
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 365,
		});
	}
}

export async function updateUser(input: UpdateUserSchema) {
	const session = await server.auth.user.sessions.current.query();

	await drizzle
		.update(users)
		.set({ ...input, id: session.user.id })
		.where(eq(users.id, session.user.id));

	const newSessionToken = await createSessionJWT({
		id: session.user.id,
		user: {
			...session.user,
			...input,
		},
	});

	cookies().set({
		...sessionCookieOptions,
		value: newSessionToken,
	});
}
