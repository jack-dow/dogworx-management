import * as z from "zod";

const SignInSchema = z.object({
	emailAddress: z.string().email(),
});
type SignInSchema = z.infer<typeof SignInSchema>;

const SignUpSchema = SignInSchema.extend({
	givenName: z.string().max(50).nonempty({ message: "Required" }),
	familyName: z.string().max(50).or(z.literal("")).optional(),
});
type SignUpSchema = z.infer<typeof SignUpSchema>;

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

export { SignInSchema, SignUpSchema, EmailOrPhoneNumberSchema };
