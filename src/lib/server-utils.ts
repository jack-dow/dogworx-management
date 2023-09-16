import S3 from "aws-sdk/clients/s3";
import { Resend } from "resend";
import { type z } from "zod";

import { env } from "../env.mjs";

type DefaultErrorCodes = "InvalidBody" | "UnknownError" | "NotAuthorized";

export type APIResponse<Data, ErrorCodes extends string | undefined = undefined> =
	| (Data extends undefined ? { success: true; error?: never } : { success: true; data: Data; error?: never })
	| {
			success: false;
			error: {
				code: ErrorCodes extends undefined ? DefaultErrorCodes : DefaultErrorCodes | ErrorCodes;
				message: string | z.ZodIssue[];
			};
			data?: never;
	  };

export const s3 = new S3({
	apiVersion: "2006-03-01",
	accessKeyId: env.AWS_S3_ACCESS_KEY,
	secretAccessKey: env.AWS_S3_SECRET_KEY,
	region: env.AWS_S3_REGION,
	signatureVersion: "v4",
});

export const resend = new Resend(env.RESEND_API_KEY);
