import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";

import { drizzle } from "~/db/drizzle";
import { organizationInviteLinks, users } from "~/db/schema";
import { type InsertUserSchema, type SelectUserSchema } from "~/db/validation";
import { SignUpSchema } from "~/lib/validation";
import { generateId, type APIResponse } from "~/utils";

export const fetchCache = "force-no-store";

type CreateUserFromInvitePOSTResponse = APIResponse<
	SelectUserSchema | { message: string; user: InsertUserSchema },
	"InviteLinkInvalid" | "AlreadyExists"
>;
async function POST(request: NextRequest): Promise<NextResponse<CreateUserFromInvitePOSTResponse>> {
	const body = (await request.json()) as unknown;

	const { searchParams } = new URL(request.url);

	const validation = SignUpSchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{ success: false, error: { code: "InvalidBody", message: validation.error.issues } },
			{ status: 400 },
		);
	}

	try {
		const inviteLink = await drizzle.query.organizationInviteLinks.findFirst({
			where: sql`BINARY ${organizationInviteLinks.id} = ${searchParams.get("id")}`,

			columns: {
				id: true,
				expiresAt: true,
				maxUses: true,
				uses: true,
				organizationId: true,
			},
		});

		if (
			!inviteLink ||
			(inviteLink.maxUses && inviteLink.uses >= inviteLink.maxUses) ||
			inviteLink.expiresAt < new Date()
		) {
			return NextResponse.json(
				{ success: false, error: { code: "InviteLinkInvalid", message: "Invite link is invalid" } },
				{ status: 400 },
			);
		}

		const newUser = {
			id: generateId(),
			givenName: validation.data.givenName,
			familyName: validation.data.familyName,
			emailAddress: validation.data.emailAddress,
			organizationId: inviteLink.organizationId,
			organizationRole: "member",
		} satisfies InsertUserSchema;

		await drizzle.transaction(async (db) => {
			await db.insert(users).values(newUser);

			if (inviteLink.maxUses && inviteLink.uses + 1 >= inviteLink.maxUses) {
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
		});

		if (user) {
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
			if (error.message.includes("code = AlreadyExists") || error.message.includes("Duplicate")) {
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
