"use client";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type SignOutPOSTResponse } from "~/app/api/auth/sign-out/route";
import { type CreateUserFromInvitePOSTResponse } from "~/app/api/auth/sign-up/invite/route";
import { type OrganizationInviteLink } from "~/db/schemas";
import { type SignUpSchema } from "../lib/validation";
import { sessionCookieOptions, type SessionCookie } from "./auth-options";
import { jwt } from "./jwt";

async function signUp(data: SignUpSchema, inviteLink: OrganizationInviteLink) {
	const signUpResponse = await fetch(`/api/auth/sign-up/invite?id=${inviteLink.id}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		cache: "no-store",
		body: JSON.stringify(data),
	});

	const body = (await signUpResponse.json()) as CreateUserFromInvitePOSTResponse;

	return body;
}

async function signOut() {
	const signOutResponse = await fetch("/api/auth/sign-out", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		cache: "no-store",
	});

	const body = (await signOutResponse.json()) as SignOutPOSTResponse;

	return body;
}

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

export { signUp, signOut, getServerSession };
