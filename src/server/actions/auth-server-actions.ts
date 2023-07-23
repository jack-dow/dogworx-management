"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieOptions, type SessionCookie } from "~/lib/auth-options";
import { jwt } from "~/lib/jwt";

function getSessionToken() {
	const cookieStore = cookies();
	const sessionCookie = cookieStore.get(sessionCookieOptions.name);

	return sessionCookie?.value;
}

async function getServerSession() {
	const sessionToken = getSessionToken();

	if (!sessionToken) {
		redirect("/sign-in");
	}

	const data = (await jwt.verify(sessionToken)) as SessionCookie;

	return data;
}

export { getServerSession };
