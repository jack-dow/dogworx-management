"use client";

import { redirect } from "next/navigation";

import { type CredentialsSignInPOSTResponse } from "~/app/api/auth/credentials-sign-in/route";
import { type CreateUserFromInvitePOSTResponse } from "~/app/api/auth/invite/[id]/route";
import { type SignOutPOSTResponse } from "~/app/api/auth/sign-out/route";
import { type OrganizationInviteLink } from "~/server/db/schemas";
import { type CredentialsSignInSchema, type CredentialsSignUpSchema } from "../lib/validation";

async function signInWithCredentials(data: CredentialsSignInSchema) {
	const signInResponse = await fetch("/api/auth/credentials-sign-in", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		cache: "no-store",
		body: JSON.stringify({ emailAddress: data.emailAddress, password: data.password }),
	});

	const body = (await signInResponse.json()) as CredentialsSignInPOSTResponse;

	return body;
}

async function signUp(data: CredentialsSignUpSchema, inviteLink: OrganizationInviteLink) {
	const signUpResponse = await fetch(`/api/auth/invite/${inviteLink.id}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		cache: "no-store",
		body: JSON.stringify(data),
	});

	const signUpBody = (await signUpResponse.json()) as CreateUserFromInvitePOSTResponse;

	if (!signUpBody.success) {
		return {
			signUp: signUpBody,
			signIn: null,
		};
	}

	const signInResponse = await signInWithCredentials({ emailAddress: data.emailAddress, password: data.password });

	return {
		signUp: signUpBody,
		signIn: signInResponse,
	};
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

export { signInWithCredentials, signUp, signOut };
