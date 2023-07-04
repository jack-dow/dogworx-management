import * as z from "zod";

import { prettyStringValidationMessage } from "./utils";

const AuthSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address",
	}),
	password: prettyStringValidationMessage("Your current password", 8, 100),
});
type AuthSchema = z.infer<typeof AuthSchema>;

const VerifyEmailSchema = z.object({
	code: z
		.string()
		.min(6, {
			message: "Verification code must be 6 characters long",
		})
		.max(6),
});
type VerifyEmailSchema = z.infer<typeof VerifyEmailSchema>;

const CheckEmailSchema = z.object({
	email: AuthSchema.shape.email,
});
type CheckEmailSchema = z.infer<typeof CheckEmailSchema>;

const ResetPasswordSchema = z
	.object({
		password: AuthSchema.shape.password,
		confirmPassword: AuthSchema.shape.password,
		code: VerifyEmailSchema.shape.code,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;

export { AuthSchema, VerifyEmailSchema, CheckEmailSchema, ResetPasswordSchema };
