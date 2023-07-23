import { NextResponse, type NextRequest } from "next/server";
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";

import { generateId, type APIResponse } from "~/lib/utils";
import { CredentialsSignUpSchema } from "~/lib/validation";
import { drizzle } from "~/server/db/drizzle";
import { organizationInviteLinks, providerAccounts, users, type User } from "~/server/db/schemas";
import { type InsertProviderAccountSchema, type InsertUserSchema } from "~/server/db/zod-validation";

export const fetchCache = "force-no-store";

type CreateUserFromInvitePOSTResponse = APIResponse<
	User | { message: string; user: InsertUserSchema },
	"InviteLinkInvalid" | "AlreadyExists"
>;

async function hashPassword(password: string) {
	return argon2.hash(password);
}

async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
): Promise<NextResponse<CreateUserFromInvitePOSTResponse>> {
	const body = (await request.json()) as unknown;

	const credentials = CredentialsSignUpSchema.safeParse(body);

	if (!credentials.success) {
		return NextResponse.json(
			{ success: false, error: { code: "InvalidBody", message: credentials.error.issues } },
			{ status: 400 },
		);
	}

	try {
		const inviteLink = await drizzle.query.organizationInviteLinks.findFirst({
			where: sql`BINARY ${organizationInviteLinks.id} = ${params.id}`,

			columns: {
				id: true,
				expiresAt: true,
				maxUses: true,
				uses: true,
				organizationId: true,
			},
		});

		if (!inviteLink || inviteLink.uses >= inviteLink.maxUses || inviteLink.expiresAt < new Date()) {
			return NextResponse.json(
				{ success: false, error: { code: "InviteLinkInvalid", message: "Invite link is invalid" } },
				{ status: 400 },
			);
		}

		const newUserId = generateId();

		const primaryEmailAddressAccount = {
			id: generateId(),
			provider: "email",
			providerAccountId: credentials.data.emailAddress,
			userId: newUserId,
		} satisfies InsertProviderAccountSchema;

		const newUser = {
			id: newUserId,
			name: credentials.data.givenName + (credentials.data.familyName ? " " + credentials.data.familyName : ""),
			givenName: credentials.data.givenName,
			familyName: credentials.data.familyName,
			password: credentials.data.password ? await hashPassword(credentials.data.password) : null,
			organizationId: inviteLink.organizationId,
			primaryEmailAddressId: primaryEmailAddressAccount.id,
		} satisfies InsertUserSchema;

		await drizzle.transaction(async (db) => {
			await db.insert(users).values(newUser);

			await db.insert(providerAccounts).values(primaryEmailAddressAccount);

			if (inviteLink.uses + 1 >= inviteLink.maxUses) {
				await db.delete(organizationInviteLinks).where(sql`BINARY ${organizationInviteLinks.id} = ${inviteLink.id}`);
			} else {
				await db
					.update(organizationInviteLinks)
					.set({
						uses: inviteLink.uses + 1,
					})
					.where(sql`BINARY ${organizationInviteLinks.id} = ${inviteLink.id}`);
			}
		});

		const user = await drizzle.query.users.findFirst({
			where: eq(users.id, newUser.id),
			with: {
				providerAccounts: true,
				sessions: true,
			},
		});

		if (user) {
			user.password = null;
			return NextResponse.json({ success: true, data: user }, { status: 201 });
		}

		return NextResponse.json(
			{
				success: true,
				data: { message: "User created, but encountered issues while querying the new user.", user: newUser },
			},
			{ status: 207 },
		);
	} catch (error) {
		if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
			if (error.message.includes("code = AlreadyExists")) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: "AlreadyExists",
							message: "Email already in use",
						},
					},
					{ status: 400 },
				);
			}
		}

		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred",
				},
			},
			{ status: 500 },
		);
	}
}

export { POST, type CreateUserFromInvitePOSTResponse };
