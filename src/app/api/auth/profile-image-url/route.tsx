import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { env } from "~/env.mjs";
import { s3 } from "~/lib/s3";
import { type APIResponse } from "~/utils";
import { verifyAPISession } from "../../utils";

type ProfileImageUrlGETResponse = APIResponse<string, "InvalidFileType" | "NotAuthorized">;

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

export { GET, type ProfileImageUrlGETResponse };
