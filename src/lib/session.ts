import { redirect } from "next/navigation";
import { getServerSession as getNextAuthServerSession } from "next-auth";

import { authOptions } from "./auth-options";

async function getServerSession() {
	const session = await getNextAuthServerSession(authOptions);

	if (!session) {
		redirect("/sign-in");
	}

	return session;
}

async function getServerUser() {
	const session = await getNextAuthServerSession(authOptions);

	if (!session) {
		redirect("/sign-in");
	}

	return session.user;
}

export { getServerSession, getServerUser };
