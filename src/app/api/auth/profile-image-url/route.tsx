import { NextResponse, type NextRequest } from "next/server";
import S3 from "aws-sdk/clients/s3";
import { z } from "zod";

import { type APIResponse } from "~/app/api/_utils";
import { drizzle } from "~/db/drizzle";
import { env } from "~/env.mjs";
import { verifyAPISession } from "../../_utils";

type ProfileImageUrlGETResponse = APIResponse<string, "InvalidFileType" | "NotAuthorized">;

const s3 = new S3({
	apiVersion: "2006-03-01",
	accessKeyId: env.AWS_S3_ACCESS_KEY,
	secretAccessKey: env.AWS_S3_SECRET_KEY,
	region: env.AWS_S3_REGION,
	signatureVersion: "v4",
});

async function GET(request: NextRequest): Promise<NextResponse<ProfileImageUrlGETResponse>> {
	const { searchParams } = new URL(request.url);

	const fileType = searchParams.get("fileType");

	if (!fileType) {
		return NextResponse.json({
			success: false,
			error: {
				code: "InvalidFileType",
				message: "No file type was provided",
			},
		});
	}

	const validation = z
		.string()
		.refine((fileType) => fileType.startsWith("image/"))
		.safeParse(fileType);

	if (!validation.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidFileType",
					message: "The file type provided is invalid",
				},
			},
			{ status: 400 },
		);
	}

	try {
		const fileType = validation.data;
		const extension = fileType.split("/")[1];

		if (!extension) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidFileType",
						message: "The file type provided is invalid",
					},
				},
				{ status: 400 },
			);
		}

		const verifiedSession = await verifyAPISession();

		if (!verifiedSession.success) {
			return NextResponse.json(
				{
					success: false,
					error: verifiedSession.error,
				},
				{
					status: verifiedSession.status,
				},
			);
		}

		const session = verifiedSession.data;

		const uploadUrl = await s3.getSignedUrlPromise("putObject", {
			Bucket: env.AWS_S3_BUCKET_NAME,
			Key: `profile-images/${session.user.id}.${extension}`,
			ContentType: fileType,
			Expires: 60,
		});

		return NextResponse.json({
			success: true,
			data: uploadUrl,
		});
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred. Please try again.",
				},
			},
			{
				status: 500,
			},
		);
	}
}

type ProfileImageUrlPOSTResponse = APIResponse<string, "InvalidFileType" | "NotAuthorized" | "UserNotFound">;

const ProfileImageUrlPOSTBodySchema = z.object({
	id: z.string(),
});

async function POST(request: NextRequest): Promise<NextResponse<ProfileImageUrlPOSTResponse>> {
	const { searchParams } = new URL(request.url);

	const fileType = searchParams.get("fileType");

	if (!fileType) {
		return NextResponse.json({
			success: false,
			error: {
				code: "InvalidFileType",
				message: "No file type was provided",
			},
		});
	}

	const body = (await request.json()) as unknown;

	const bodyValidation = ProfileImageUrlPOSTBodySchema.safeParse(body);

	if (!bodyValidation.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidBody",
					message: bodyValidation.error.issues,
				},
			},
			{ status: 400 },
		);
	}

	const fileTypeValidation = z
		.string()
		.refine((fileType) => fileType.startsWith("image/"))
		.safeParse(fileType);

	if (!fileTypeValidation.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "InvalidFileType",
					message: "The file type provided is invalid",
				},
			},
			{ status: 400 },
		);
	}

	try {
		const fileType = fileTypeValidation.data;
		const extension = fileType.split("/")[1];

		if (!extension) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "InvalidFileType",
						message: "The file type provided is invalid",
					},
				},
				{ status: 400 },
			);
		}

		const verifiedSession = await verifyAPISession();

		if (!verifiedSession.success) {
			return NextResponse.json(
				{
					success: false,
					error: verifiedSession.error,
				},
				{
					status: verifiedSession.status,
				},
			);
		}

		const session = verifiedSession.data;

		if (
			session.user.id !== bodyValidation.data.id &&
			session.user.organizationRole !== "owner" &&
			session.user.organizationRole !== "admin"
		) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "NotAuthorized",
						message: "You are not authorized to upload a profile image for this user",
					},
				},
				{
					status: 403,
				},
			);
		}

		const user = await drizzle.query.users.findFirst({
			where: (users, { eq, and }) =>
				and(eq(users.organizationId, session.user.organizationId), eq(users.id, bodyValidation.data.id)),
			columns: {
				id: true,
				organizationRole: true,
			},
		});

		if (!user) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "UserNotFound",
						message: "The user was not found",
					},
				},
				{
					status: 404,
				},
			);
		}

		const uploadUrl = await s3.getSignedUrlPromise("putObject", {
			Bucket: env.AWS_S3_BUCKET_NAME,
			Key: `profile-images/${user.id}.${extension}`,
			ContentType: fileType,
			Expires: 60,
		});

		return NextResponse.json({
			success: true,
			data: uploadUrl,
		});
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UnknownError",
					message: "An unknown error occurred. Please try again.",
				},
			},
			{
				status: 500,
			},
		);
	}
}

export { GET, type ProfileImageUrlGETResponse, POST, type ProfileImageUrlPOSTResponse };
