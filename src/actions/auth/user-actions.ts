"use server";

import { cookies } from "next/headers";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schema";
import { UpdateUserSchema } from "~/db/validation";
import { createSessionJWT, sessionCookieOptions } from "~/lib/auth-options";
import { createServerAction, getServerUser } from "../utils";

dayjs.extend(utc);
dayjs.extend(timezone);

const updateUser = createServerAction(async (data: UpdateUserSchema) => {
	const validation = UpdateUserSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		await drizzle
			.update(users)
			.set({ ...validation.data, id: user.id })
			.where(eq(users.id, user.id));

		const newSessionToken = await createSessionJWT({
			id: user.id,
			user: {
				...user,
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

const deleteUser = createServerAction(async () => {
	try {
		const user = await getServerUser();

		if (user.organizationRole === "owner") {
			return {
				success: false,
				error: "You must transfer ownership of your organization before you can delete your account.",
				data: null,
			};
		}

		await drizzle.delete(users).where(eq(users.id, user.id));

		cookies().set({
			...sessionCookieOptions,
			value: "",
		});

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to delete user", data: null };
	}
});

// eslint-disable-next-line @typescript-eslint/require-await
const setUserTimezone = createServerAction(async (timezone: string) => {
	if (!dayjs().tz(timezone, true).isValid()) {
		return { success: false, error: "Invalid timezone", data: null };
	}

	try {
		cookies().set({
			name: "timezone",
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			value: timezone,
		});

		return { success: true, data: null };
	} catch {
		return { success: false, error: `Failed to set timezone offset to ${timezone}`, data: null };
	}
});

export { updateUser, deleteUser, setUserTimezone };
