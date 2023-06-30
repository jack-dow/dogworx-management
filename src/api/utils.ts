/* eslint-disable @typescript-eslint/no-explicit-any */
import { createId } from "@paralleldrive/cuid2";
import { type z } from "zod";

const generateId = createId;

type ServerActionResponse<Data, Error> =
	| {
			success: true;
			data?: Data;
	  }
	| {
			success: false;
			error: Error;
	  };

type ExtractServerActionData<T extends (...params: any) => Promise<ServerActionResponse<any, any>>> =
	ReturnType<T> extends Promise<ServerActionResponse<infer Data, any>> ? Data : never;

function createServerAction<Fn extends (...params: any) => Promise<ServerActionResponse<any, z.ZodIssue[] | string>>>(
	fn: Fn,
) {
	return fn;
}

export { generateId, type ExtractServerActionData, createServerAction };
