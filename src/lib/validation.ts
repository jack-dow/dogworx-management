import * as z from "zod";

const GoogleProviderSchema = z.object({
	sub: z.string(),
	email: z.string(),
	email_verified: z.boolean(),
	name: z.string(),
	given_name: z.string(),
	family_name: z.string().optional(),
	picture: z.string(),
	locale: z.string(),
});

const CredentialsSignInSchema = z.object({
	emailAddress: z.string().email(),
	password: z.string().min(8).max(100),
});
type CredentialsSignInSchema = z.infer<typeof CredentialsSignInSchema>;

const CredentialsSignUpSchema = CredentialsSignInSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	familyName: z.string().max(50).or(z.literal("")).optional(),
});
type CredentialsSignUpSchema = z.infer<typeof CredentialsSignUpSchema>;

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
	emailAddress: CredentialsSignInSchema.shape.emailAddress,
});
type CheckEmailSchema = z.infer<typeof CheckEmailSchema>;

const ResetPasswordSchema = z
	.object({
		password: CredentialsSignInSchema.shape.password,
		confirmPassword: CredentialsSignInSchema.shape.password,
		code: VerifyEmailSchema.shape.code,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
type ResetPasswordSchema = z.infer<typeof ResetPasswordSchema>;

/** Combine with the rest of the form schema using z.intersection to ensure the super refine is validated at the same time as the rest of the fields */
const EmailOrPhoneNumberSchema = z
	.object({
		emailAddress: z.string().email().max(128).or(z.literal("")).optional(),
		phoneNumber: z.string().min(9).max(16).or(z.literal("")).optional(),
	})
	.superRefine((val, ctx) => {
		if (!val.emailAddress && !val.phoneNumber) {
			const message = "Email address or phone number required";
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["emailAddress"],
			});
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 1,
				type: "string",
				inclusive: true,
				message: message,
				path: ["phoneNumber"],
			});
		}
	});
type EmailOrPhoneNumberSchema = z.infer<typeof EmailOrPhoneNumberSchema>;

export {
	CredentialsSignInSchema,
	CredentialsSignUpSchema,
	VerifyEmailSchema,
	CheckEmailSchema,
	ResetPasswordSchema,
	EmailOrPhoneNumberSchema,
};
