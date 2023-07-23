/* eslint-disable @typescript-eslint/no-explicit-any */
import { type z } from "zod";

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

export { type ExtractServerActionData, createServerAction };
