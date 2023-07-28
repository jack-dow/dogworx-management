"use client";

import { type SignOutPOSTResponse } from "~/app/api/auth/sign-out/route";
import { type CreateUserFromInvitePOSTResponse } from "~/app/api/auth/sign-up/invite/route";
import { type OrganizationInviteLink } from "~/db/schemas";
import { type SignUpSchema } from "../lib/validation";

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

export { signUp, signOut };
