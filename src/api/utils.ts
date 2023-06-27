/* eslint-disable @typescript-eslint/no-explicit-any */
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

type RouterResponse<Data, Error> =
	| {
			success: true;
			data?: Data;
	  }
	| {
			success: false;
			error: Error;
	  };

function createRouterResponse<Fn extends (...params: any) => Promise<RouterResponse<any, z.ZodIssue[] | string>>>(
	fn: Fn,
) {
	return fn;
}

const generateId = createId;

const SearchTermSchema = z.string().optional();

export { generateId, SearchTermSchema, createRouterResponse };
