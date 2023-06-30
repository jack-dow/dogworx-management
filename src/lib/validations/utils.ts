import { z } from "zod";

function prettyStringValidationMessage(label: string, min: number, max: number) {
	return z
		.string()
		.min(min, { message: `${label} must be at least ${min} characters long` })
		.max(max, { message: `${label} must be at most ${max} characters long` });
}

export { prettyStringValidationMessage };
