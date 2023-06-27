import * as z from "zod";

const AuthSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address",
	}),
	password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(100)
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
			message:
				"Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
		}),
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
