import { type z } from "zod";

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
