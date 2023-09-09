"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { drizzle } from "~/db/drizzle";
import { users } from "~/db/schema";
import { InsertUserSchema, UpdateUserSchema } from "~/db/validation";
import { createServerAction, getServerUser, type ExtractServerActionData } from "../utils";

const insertOrganizationsUser = createServerAction(async (data: InsertUserSchema) => {
	const validation = InsertUserSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return { success: false, error: "You are not authorized to create new users for your organization.", data: null };
		}

		await drizzle.transaction(async (tx) => {
			await tx.insert(users).values({
				...validation.data,
				organizationId: user.organizationId === "1" ? validation.data.organizationId : user.organizationId,
			});

			if (user.organizationRole === "owner" && validation.data.organizationRole === "owner") {
				await tx.update(users).set({ organizationRole: "admin" }).where(eq(users.id, user.id));
			}
		});

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to insert user", data: null };
	}
});
type OrganizationsUserInsert = ExtractServerActionData<typeof insertOrganizationsUser>;

const updateOrganizationsUser = createServerAction(async (data: UpdateUserSchema) => {
	const validation = UpdateUserSchema.safeParse(data);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return { success: false, error: "You are not authorized to update users for your organization.", data: null };
		}

		const { id, ...data } = validation.data;

		await drizzle.transaction(async (tx) => {
			await drizzle
				.update(users)
				.set(data)
				.where(
					and(
						user.organizationId !== "1" ? eq(users.organizationId, user.organizationId) : undefined,
						eq(users.id, id),
					),
				);

			if (user.organizationRole === "owner" && validation.data.organizationRole === "owner") {
				await tx.update(users).set({ organizationRole: "admin" }).where(eq(users.id, user.id));
			}
		});

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to update user", data: null };
	}
});
type OrganizationsUserUpdate = ExtractServerActionData<typeof updateOrganizationsUser>;

const deleteOrganizationsUser = createServerAction(async (id: string) => {
	const validation = z.string().safeParse(id);

	if (!validation.success) {
		return { success: false, error: validation.error.issues, data: null };
	}

	try {
		const user = await getServerUser();

		if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
			return { success: false, error: "You are not authorized to delete users for your organization.", data: null };
		}

		if (user.id === id && user.organizationRole === "owner") {
			return {
				success: false,
				error: "You must transfer ownership of your organization before you can delete your account.",
				data: null,
			};
		}

		if (user.organizationId !== "1") {
			const deletingUser = await drizzle.query.users.findFirst({
				where: and(eq(users.organizationId, user.organizationId), eq(users.id, id)),
			});

			if (!deletingUser) {
				return { success: false, error: "User not found", data: null };
			}

			if (
				deletingUser.organizationRole === "owner" ||
				(user.organizationRole === "admin" && deletingUser.organizationRole === "admin")
			) {
				return {
					success: false,
					error: "You are not authorized to delete this user.",
					data: null,
				};
			}
		}

		await drizzle
			.delete(users)
			.where(
				and(user.organizationId !== "1" ? eq(users.organizationId, user.organizationId) : undefined, eq(users.id, id)),
			);

		revalidatePath("/settings/organization");
		revalidatePath("/organizations/[id]");

		return { success: true, data: undefined };
	} catch {
		return { success: false, error: "Failed to delete user", data: null };
	}
});
type OrganizationsUserDelete = ExtractServerActionData<typeof deleteOrganizationsUser>;

export {
	insertOrganizationsUser,
	type OrganizationsUserInsert,
	updateOrganizationsUser,
	type OrganizationsUserUpdate,
	deleteOrganizationsUser,
	type OrganizationsUserDelete,
};
