import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import {
	bookings,
	bookingTypes,
	clients,
	dogs,
	dogToClientRelationships,
	dogToVetRelationships,
	vetClinics,
	vets,
	vetToVetClinicRelationships,
} from "~/db/schema/app";
import {
	organizationInviteLinks,
	organizationInviteLinks as organizationInviteLinksTable,
	organizations,
	sessions,
	users,
} from "~/db/schema/auth";
import {
	InsertOrganizationInviteLinkSchema,
	InsertOrganizationSchema,
	InsertUserSchema,
	UpdateOrganizationInviteLinkSchema,
	UpdateOrganizationSchema,
	UpdateUserSchema,
} from "~/db/validation/auth";
import { env } from "~/env.mjs";
import { PaginationOptionsSchema, validatePaginationSearchParams } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { ORGANIZATIONS_SORTABLE_COLUMNS } from "../sortable-columns";

export const organizationsRouter = createTRPCRouter({
	all: protectedProcedure.input(PaginationOptionsSchema).query(async ({ ctx, input }) => {
		if (ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not authorized to complete this action." });
		}

		const countQuery = await ctx.db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(organizations);

		const { count, page, limit, maxPage, sortBy, sortDirection, orderBy } = validatePaginationSearchParams({
			...input,
			count: countQuery?.[0]?.count ?? 0,
			sortableColumns: ORGANIZATIONS_SORTABLE_COLUMNS,
		});

		const data = await ctx.db.query.organizations.findMany({
			columns: {
				id: true,
				name: true,
				maxUsers: true,
			},
			limit: limit ?? 50,
			orderBy: (organizations, { asc }) => (orderBy ? [...orderBy, asc(organizations.id)] : [asc(organizations.id)]),
			with: {
				organizationUsers: {
					columns: {
						id: true,
					},
				},
			},
		});

		return {
			pagination: {
				count,
				page,
				maxPage,
				limit,
				sortBy,
				sortDirection,
			},
			data,
		};
	}),

	search: protectedProcedure.input(z.object({ searchTerm: z.string() })).query(async ({ ctx, input }) => {
		if (ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not authorized to complete this action." });
		}

		const data = await ctx.db.query.organizations.findMany({
			where: (organization, { like }) => like(organizations.name, `%${input.searchTerm}%`),
			limit: 50,
			orderBy: (organizations, { asc }) => [asc(organizations.name), asc(organizations.id)],
		});

		return { data };
	}),

	byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const id = ctx.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID ? input.id : ctx.user.organizationId;

		const data = await ctx.db.query.organizations.findFirst({
			where: (organizations, { eq }) => eq(organizations.id, id),
			with: {
				organizationInviteLinks: {
					orderBy: (organizationInviteLinks, { asc }) => [
						asc(organizationInviteLinks.createdAt),
						asc(organizationInviteLinks.expiresAfter),
					],
					with: {
						user: {
							columns: {
								id: true,
								givenName: true,
								familyName: true,
								emailAddress: true,
								organizationRole: true,
								profileImageUrl: true,
							},
						},
					},
				},
				organizationUsers: {
					orderBy: (users, { asc }) => [
						asc(users.organizationRole),
						asc(users.givenName),
						asc(users.familyName),
						asc(users.id),
					],
					with: {
						sessions: {
							orderBy: (sessions, { desc }) => [desc(sessions.updatedAt)],
							columns: {
								id: true,
								updatedAt: true,
								city: true,
								country: true,
								expiresAt: true,
								ipAddress: true,
								userAgent: true,
								lastActiveAt: true,
							},
						},
					},
				},
			},
		});

		return { data };
	}),

	insert: protectedProcedure.input(InsertOrganizationSchema).mutation(async ({ ctx, input }) => {
		if (ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not authorized to complete this action." });
		}

		const { organizationInviteLinks, organizationUsers, ...data } = input;

		await ctx.db.transaction(async (trx) => {
			await trx.insert(organizations).values(data);

			if (organizationInviteLinks && organizationInviteLinks.length > 0) {
				const organizationInviteLinksArray = organizationInviteLinks.map((inviteLink) => ({
					...inviteLink,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(organizationInviteLinksTable).values(organizationInviteLinksArray);
			}

			if (organizationUsers && organizationUsers.length > 0) {
				const organizationUsersArray = organizationUsers.map((user) => ({
					...user,
					organizationId: ctx.user.organizationId,
				}));

				await trx.insert(users).values(organizationUsersArray);
			}
		});
	}),

	update: protectedProcedure.input(UpdateOrganizationSchema).mutation(async ({ ctx, input }) => {
		// eslint-disable-next-line prefer-const
		let { id, ...data } = input;

		id = ctx.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID ? id : ctx.user.organizationId;

		await ctx.db.transaction(async (trx) => {
			await trx.update(organizations).set(data).where(eq(organizations.id, id));
		});
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		if (
			ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID &&
			!(ctx.user.organizationRole === "owner" && ctx.user.organizationId === input.id)
		) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not authorized to complete this action." });
		}

		const id = ctx.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID ? input.id : ctx.user.organizationId;

		const organization = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.id, input.id),
			columns: {
				id: true,
			},
		});

		if (organization) {
			await ctx.db.transaction(async (trx) => {
				await trx.delete(organizations).where(eq(organizations.id, id));

				await trx.delete(bookingTypes).where(eq(bookingTypes.organizationId, id));
				await trx.delete(bookings).where(eq(bookings.organizationId, id));
				await trx.delete(clients).where(eq(clients.organizationId, id));
				await trx.delete(dogs).where(eq(dogs.organizationId, id));
				await trx.delete(users).where(eq(users.organizationId, id));
				await trx.delete(vetClinics).where(eq(vetClinics.organizationId, id));
				await trx.delete(vets).where(eq(vets.organizationId, id));
				await trx.delete(dogToClientRelationships).where(eq(dogToClientRelationships.organizationId, id));
				await trx.delete(dogToVetRelationships).where(eq(dogToVetRelationships.organizationId, id));
				await trx.delete(vetToVetClinicRelationships).where(eq(vetToVetClinicRelationships.organizationId, id));
				await trx.delete(organizationInviteLinks).where(eq(organizationInviteLinks.organizationId, id));
			});
		}
	}),

	inviteLinks: createTRPCRouter({
		byId: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
			const data = await ctx.db.query.organizationInviteLinks.findFirst({
				where: sql`BINARY ${organizationInviteLinks.id} = ${input.id}`,
				with: {
					organization: {
						columns: {
							id: true,
							name: true,
							maxUsers: true,
						},
					},
				},
			});

			return { data };
		}),

		insert: protectedProcedure.input(InsertOrganizationInviteLinkSchema).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to create invite links for your organization.",
				});
			}

			await ctx.db.insert(organizationInviteLinks).values({
				...input,
				organizationId:
					ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID || !input.organizationId
						? ctx.user.organizationId
						: input.organizationId,
			});
		}),

		update: protectedProcedure.input(UpdateOrganizationInviteLinkSchema).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to update invite links for your organization.",
				});
			}

			const { id, ...data } = input;

			await ctx.db
				.update(organizationInviteLinks)
				.set(data)
				.where(
					and(
						ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID
							? eq(organizationInviteLinks.organizationId, ctx.user.organizationId)
							: undefined,
						eq(organizationInviteLinks.id, id),
					),
				);
		}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to delete invite links for your organization.",
				});
			}

			await ctx.db
				.delete(organizationInviteLinks)
				.where(
					and(
						ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID
							? eq(organizationInviteLinks.organizationId, ctx.user.organizationId)
							: undefined,
						eq(organizationInviteLinks.id, input.id),
					),
				);
		}),
	}),

	users: createTRPCRouter({
		search: protectedProcedure.input(z.object({ searchTerm: z.string() })).query(async ({ ctx, input }) => {
			const data = await ctx.db.query.users.findMany({
				where: (users, { like }) =>
					and(
						ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID
							? eq(users.organizationId, ctx.user.organizationId)
							: undefined,
						or(
							sql`CONCAT(${users.givenName},' ', ${users.familyName}) LIKE CONCAT('%', ${input.searchTerm}, '%')`,
							like(users.emailAddress, `%${input.searchTerm}%`),
						),
					),
				limit: 50,
				orderBy: (users, { asc }) => [asc(users.givenName), asc(users.familyName), asc(users.id)],
			});

			return { data };
		}),

		insert: protectedProcedure.input(InsertUserSchema).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to insert users for your organization.",
				});
			}

			await ctx.db.transaction(async (tx) => {
				await tx.insert(users).values({
					...input,
					organizationId:
						ctx.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID ? input.organizationId : ctx.user.organizationId,
				});

				if (
					ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID &&
					ctx.user.organizationRole === "owner" &&
					input.organizationRole === "owner"
				) {
					await tx.update(users).set({ organizationRole: "admin" }).where(eq(users.id, ctx.user.id));
				}
			});
		}),

		update: protectedProcedure.input(UpdateUserSchema).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to update users for your organization.",
				});
			}

			const { id, ...data } = input;

			await ctx.db.transaction(async (tx) => {
				await ctx.db
					.update(users)
					.set({
						...data,
						organizationRole:
							ctx.user.organizationId === env.NEXT_PUBLIC_ADMIN_ORG_ID
								? data.organizationRole
								: ctx.user.organizationRole === "owner"
								? data.organizationRole
								: undefined,
					})
					.where(
						and(
							ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID
								? eq(users.organizationId, ctx.user.organizationId)
								: undefined,
							eq(users.id, id),
						),
					);

				if (
					ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID &&
					ctx.user.organizationRole === "owner" &&
					input.organizationRole === "owner"
				) {
					await tx.update(users).set({ organizationRole: "admin" }).where(eq(users.id, ctx.user.id));
				}
			});
		}),

		getProfileImageUrl: protectedProcedure
			.input(z.object({ id: z.string(), fileType: z.string().refine((fileType) => fileType.startsWith("image/")) }))
			.mutation(async ({ ctx, input }) => {
				if (
					ctx.user.id !== input.id &&
					ctx.user.organizationRole !== "owner" &&
					ctx.user.organizationRole !== "admin"
				) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to update this user.",
					});
				}

				const s3 = new S3Client({
					region: env.AWS_S3_REGION,
					credentials: {
						accessKeyId: env.AWS_S3_ACCESS_KEY,
						secretAccessKey: env.AWS_S3_SECRET_KEY,
					},
				});

				const extension = input.fileType.split("/")[1];

				if (!extension) {
					throw new TRPCError({ code: "BAD_REQUEST", message: "Could not determine file extension." });
				}

				const user = await ctx.db.query.users.findFirst({
					where: (users, { eq, and }) => and(eq(users.organizationId, ctx.user.organizationId), eq(users.id, input.id)),
					columns: {
						id: true,
						organizationRole: true,
					},
				});

				if (!user) {
					throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
				}

				const command = new PutObjectCommand({
					Bucket: env.AWS_S3_BUCKET_NAME,
					Key: `profile-images/${user.id}.${extension}`,
				});

				const signedUrl = await getSignedUrl(s3, command, {
					expiresIn: 180,
				});

				return { data: signedUrl };
			}),

		delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
			if (ctx.user.organizationRole !== "owner" && ctx.user.organizationRole !== "admin") {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to delete users for your organization.",
				});
			}

			if (ctx.user.id === input.id && ctx.user.organizationRole === "owner") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You must transfer ownership of your organization before you can delete your account.",
				});
			}

			if (ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID) {
				const deletingUser = await ctx.db.query.users.findFirst({
					where: and(eq(users.organizationId, ctx.user.organizationId), eq(users.id, input.id)),
				});

				if (deletingUser && ctx.user.organizationRole === "admin" && deletingUser.organizationRole === "admin") {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You are not authorized to delete this user.",
					});
				}
			}

			await ctx.db
				.delete(users)
				.where(
					and(
						ctx.user.organizationId !== env.NEXT_PUBLIC_ADMIN_ORG_ID
							? eq(users.organizationId, ctx.user.organizationId)
							: undefined,
						eq(users.id, input.id),
					),
				);
			await ctx.db.delete(sessions).where(eq(sessions.userId, input.id));
			await ctx.db.delete(organizationInviteLinks).where(eq(organizationInviteLinks.userId, input.id));
		}),
	}),
});
