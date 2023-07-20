import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schemas";
import { env } from "~/env.mjs";
import { AdapterDrizzle } from "./next-auth-adapter-drizzle";

const GoogleProviderSchema = z.object({
	sub: z.string(),
	email: z.string(),
	email_verified: z.boolean(),
	name: z.string(),
	given_name: z.string(),
	family_name: z.string().optional(),
	picture: z.string(),
	locale: z.string(),
});

const authOptions: NextAuthOptions = {
	adapter: AdapterDrizzle(),
	providers: [
		GoogleProvider({
			clientId: env.OAUTH_GOOGLE_CLIENT_ID,
			clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET,
			profile(profile) {
				const parsedProfile = GoogleProviderSchema.parse(profile);

				return {
					id: parsedProfile.sub,
					name: parsedProfile.name,
					givenName: parsedProfile.given_name,
					familyName: parsedProfile.family_name ?? "",
					email: parsedProfile.email,
					emailVerified: parsedProfile.email_verified ? new Date() : null,
					image: parsedProfile.picture,
					password: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			},
		}),
		CredentialsProvider({
			type: "credentials",

			credentials: {
				email: {
					label: "Email",
					type: "email",
				},
				password: { label: "Password", type: "password" },
			},

			async authorize(credentials) {
				if (!credentials) {
					return null;
				}

				const user = await drizzle.query.users.findFirst({
					where: eq(users.email, credentials.email),
				});

				if (user && user.password && bcrypt.compareSync(user.password, credentials.password)) {
					return user;
				}

				return null;
			},
		}),
	],
	callbacks: {
		async signIn({ user,  }) {
			console.log(window.location);
			if (user.email) {
				const existingUser = await drizzle.query.users.findFirst({
					where: eq(users.email, user.email),
				});

				return Boolean(existingUser);
			}

			return false;
		},
		jwt: ({ token, user }) => {
			user && (token.user = user);
			return token;
		},
		session: ({ session, token }) => {
			if (token?.user) {
				session.user = token.user as Session["user"];
			}
			return session;
		},
	},
	pages: {
		signIn: "/sign-in",
	},
	session: {
		strategy: "jwt",
	},
};

export { authOptions };
