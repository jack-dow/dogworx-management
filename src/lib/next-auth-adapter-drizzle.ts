import { and, eq } from "drizzle-orm";
import { type Adapter } from "next-auth/adapters";

import { generateId } from "~/api";
import { drizzle } from "~/db/drizzle";
import { accounts, sessions, users, verificationTokens } from "~/db/schemas";

function AdapterDrizzle(): Adapter {
	return {
		createUser: async (data) => {
			console.log("create user", data);

			const id = generateId();

			await drizzle.insert(users).values({ ...data, id });

			const user = await drizzle.query.users.findFirst({
				where: eq(users.id, id),
			});

			return user!;
		},
		getUser: async (data) => {
			const user = await drizzle.query.users.findFirst({
				where: eq(users.id, data),
			});

			return user ?? null;
		},
		getUserByEmail: async (data) => {
			const user = await drizzle.query.users.findFirst({
				where: eq(users.email, data),
			});

			return user ?? null;
		},
		createSession: async (data) => {
			const id = generateId();
			await drizzle.insert(sessions).values({ ...data, id });

			const session = await drizzle.query.sessions.findFirst({
				where: eq(sessions.sessionToken, data.sessionToken),
			});

			return session!;
		},
		getSessionAndUser: async (data) => {
			const sessionAndUser = await drizzle.query.sessions.findFirst({
				where: eq(sessions.sessionToken, data),
				with: {
					user: true,
				},
			});

			if (sessionAndUser) {
				const { user, ...session } = sessionAndUser;
				return {
					session,
					user,
				};
			}

			return null;
		},
		updateUser: async (data) => {
			if (!data.id) {
				throw new Error("[updateUser] No user id.");
			}

			await drizzle.update(users).set(data).where(eq(users.id, data.id));

			const user = await drizzle.query.users.findFirst({
				where: eq(users.id, data.id),
			});

			return user!;
		},
		updateSession: async (data) => {
			await drizzle.update(sessions).set(data).where(eq(sessions.sessionToken, data.sessionToken));

			const session = await drizzle.query.sessions.findFirst({
				where: eq(sessions.sessionToken, data.sessionToken),
			});

			return session!;
		},
		linkAccount: async (rawAccount) => {
			const id = generateId();
			await drizzle.insert(accounts).values({ ...rawAccount, id });
		},
		getUserByAccount: async (data) => {
			const account = await drizzle.query.accounts.findFirst({
				where: and(eq(accounts.providerAccountId, data.providerAccountId), eq(accounts.provider, data.provider)),
			});

			if (account) {
				const user = await drizzle.query.users.findFirst({
					where: eq(users.id, account.userId),
				});

				return user ?? null;
			}

			return null;
		},
		deleteSession: async (sessionToken) => {
			await drizzle.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
		},
		createVerificationToken: async (token) => {
			await drizzle.insert(verificationTokens).values(token);

			const verificationToken = await drizzle.query.verificationTokens.findFirst({
				where: and(eq(verificationTokens.identifier, token.identifier), eq(verificationTokens.token, token.token)),
			});

			return verificationToken!;
		},
		useVerificationToken: async (token) => {
			const verificationToken = await drizzle.query.verificationTokens.findFirst({
				where: and(eq(verificationTokens.identifier, token.identifier), eq(verificationTokens.token, token.token)),
			});

			return verificationToken ?? null;
		},
		deleteUser: async (id) => {
			await drizzle.delete(users).where(eq(users.id, id));

			await drizzle.delete(accounts).where(eq(accounts.userId, id));

			await drizzle.delete(sessions).where(eq(sessions.userId, id));
		},
		unlinkAccount: async (account) => {
			await drizzle
				.delete(accounts)
				.where(and(eq(accounts.providerAccountId, account.providerAccountId), eq(accounts.provider, account.provider)));
		},
	};
}

export { AdapterDrizzle };
